"use client";

import { useState, useCallback, useMemo } from 'react';
import { Info, Target, BookOpen, Flag, Copy } from 'lucide-react';
import type { Message } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { ChatTranscript } from './chat-transcript';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationRow {
  id: string;
  status?: string;
  createdAt?: any;
  messages?: Message[];
  customerEmail?: string; // futuro
  customerPhone?: string; // futuro
}

interface Props {
  conversations: ConversationRow[];
  loading: boolean;
}

export function ConversationsTable({ conversations, loading }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = conversations.find(c => c.id === selectedId);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Hook debe declararse antes de cualquier return condicional para no romper el orden de Hooks.
  const exportCSV = useCallback(() => {
    const rows = conversations.map(c => ({
      id: c.id,
      status: c.status || '',
      createdAt: c.createdAt?.toDate ? c.createdAt.toDate().toISOString() : '',
      messages: (c.messages || []).length,
      preview: (c.messages || []).slice(0,3).map(m => `${m.role}: ${m.text.replace(/\n/g,' ')}`).join(' | ')
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const body = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const csv = header + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversaciones.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [conversations]);

  const handleSummarize = async () => {
    if (!selected || summarizing) return;
    setSummarizing(true);
    setSummaryError(null);
    setSummary(null);
    try {
      const resp = await fetch('/api/summarize-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: selected.messages || [] })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Fallo al resumir');
      setSummary(data.summary);
    } catch (e: any) {
      setSummaryError(e.message);
    } finally {
      setSummarizing(false);
    }
  };

  const formattedSummary = useMemo(() => {
    if (!summary) return null;
    // Intentar dividir por líneas y mapear claves
    const lines = summary.split(/\r?\n/).filter(l => l.trim());
    const mapping: { key: string; icon: any; label: string; color: string }[] = [
      { key: 'contexto:', icon: Info, label: 'Contexto', color: 'text-blue-600 dark:text-blue-400' },
      { key: 'necesidad:', icon: Target, label: 'Necesidad', color: 'text-amber-600 dark:text-amber-400' },
      { key: 'cursos:', icon: BookOpen, label: 'Cursos', color: 'text-emerald-600 dark:text-emerald-400' },
      { key: 'acción:', icon: Flag, label: 'Acción', color: 'text-fuchsia-600 dark:text-fuchsia-400' },
    ];
    const items = lines.map(raw => {
      const lower = raw.toLowerCase();
      const map = mapping.find(m => lower.startsWith(m.key));
      if (map) {
        const value = raw.substring(map.key.length).trim() || '—';
        const Icon = map.icon;
        return (
          <div key={map.key} className="flex gap-2 rounded-md bg-background/60 border border-border/60 px-3 py-2 shadow-sm">
            <div className={`mt-0.5 ${map.color}`}><Icon className="h-4 w-4" /></div>
            <div className="text-xs leading-relaxed">
              <p className="font-semibold tracking-wide text-[11px] uppercase opacity-80">{map.label}</p>
              <p className="mt-0.5 whitespace-pre-wrap break-words">{value}</p>
            </div>
          </div>
        );
      }
      return <div key={raw} className="text-xs whitespace-pre-wrap break-words px-2 py-1 rounded bg-muted/30">{raw}</div>;
    });
    return (
      <div className="space-y-2">
        {items}
      </div>
    );
  }, [summary]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return <p className="text-sm text-muted-foreground">No hay conversaciones aún.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Columna izquierda: lista scrollable independiente */}
      <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-1">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-muted-foreground">{conversations.length} conversación(es)</p>
          {conversations.length > 0 && (
            <button onClick={exportCSV} className="text-xs border rounded-md px-2 py-1 hover:bg-muted font-medium">Exportar CSV</button>
          )}
        </div>
        <table className="w-full text-sm border rounded-md overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Cliente</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Creada</th>
              <th className="p-2">Msgs</th>
            </tr>
          </thead>
            <tbody>
              {conversations.map(c => {
                const firstUserMsg = c.messages?.find(m => m.role === 'user');
                const customerName = firstUserMsg?.text?.slice(0, 25) || 'Cliente';
                return (
                  <tr key={c.id} className={`cursor-pointer hover:bg-muted/40 ${selectedId === c.id ? 'bg-muted/60' : ''}`} onClick={() => setSelectedId(c.id)}>
                    <td className="p-2 font-medium">{customerName}</td>
                    <td className="p-2">{c.status || '—'}</td>
                    <td className="p-2 whitespace-nowrap">{c.createdAt?.toDate ? format(c.createdAt.toDate(), 'dd/MM HH:mm', { locale: es }) : '—'}</td>
                    <td className="p-2 text-center">{c.messages?.length || 0}</td>
                  </tr>
                );
              })}
            </tbody>
        </table>
        <p className="text-xs text-muted-foreground sticky bottom-0 bg-background/90 backdrop-blur pt-2 pb-1 mt-2 border-t">Pulsa una fila para ver el transcript. Usa Exportar para descargar un resumen.</p>
      </div>
      {/* Columna derecha: panel sticky que siempre queda visible */}
      <div className="md:sticky md:top-4 self-start">
        {selected ? (
          <ScrollArea className="h-[80vh] border rounded-md">
            <div className="p-4 pb-3 border-b bg-muted/30 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="block text-[10px] uppercase text-muted-foreground tracking-wide">Cliente</span>
                  <span className="font-medium">{(selected.messages?.find(m=>m.role==='user')?.text?.slice(0,40)) || 'Cliente'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-muted-foreground tracking-wide">Estado</span>
                  <span>{selected.status || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-muted-foreground tracking-wide">Creada</span>
                  <span>{selected.createdAt?.toDate ? format(selected.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : '—'}</span>
                </div>
                <div className="truncate max-w-[140px]" title={selected.id}>
                  <span className="block text-[10px] uppercase text-muted-foreground tracking-wide">ID</span>
                  <span className="font-mono text-[11px]">{selected.id}</span>
                </div>
                {selected.customerEmail && (
                  <div>
                    <span className="block text-[10px] uppercase text-muted-foreground tracking-wide">Email</span>
                    <span className="truncate max-w-[160px]">{selected.customerEmail}</span>
                  </div>
                )}
                {selected.customerPhone && (
                  <div>
                    <span className="block text-[10px] uppercase text-muted-foreground tracking-wide">Teléfono</span>
                    <span>{selected.customerPhone}</span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSummarize}
                  disabled={summarizing}
                  className="px-2 py-1 text-xs border rounded-md hover:bg-muted disabled:opacity-50"
                >{summarizing ? 'Generando resumen...' : 'Generar resumen IA'}</button>
                {summary && (
                  <button
                    onClick={() => navigator.clipboard.writeText(summary)}
                    className="px-2 py-1 text-xs border rounded-md hover:bg-muted"
                  >Copiar resumen</button>
                )}
                {summaryError && <span className="text-[10px] text-red-600">{summaryError}</span>}
              </div>
            </div>
            <div className="p-4">
              {summary && (
                <div className="mb-4 rounded-lg border border-border/70 bg-gradient-to-br from-muted/70 via-background to-background p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_30%_25%,theme(colors.primary/30),transparent_60%)]" />
                  <div className="relative flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Resumen IA</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => summary && navigator.clipboard.writeText(summary)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium hover:bg-muted"
                        title="Copiar texto completo"
                      >
                        <Copy className="h-3 w-3" /> Copiar
                      </button>
                      <button
                        onClick={() => { setSummary(null); setSummaryError(null); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-medium hover:bg-muted"
                        title="Cerrar resumen"
                      >X</button>
                    </div>
                  </div>
                  {formattedSummary}
                </div>
              )}
              <ChatTranscript 
                lead={{
                  id: selected.id,
                  customerName: 'Cliente',
                  advisorName: 'Asesor',
                  status: (selected.status as any) || 'Iniciado',
                  lastContact: '',
                  messages: selected.messages || [],
                } as any}
                transcript={selected.messages || []}
                loading={false}
              />
            </div>
          </ScrollArea>
        ) : (
          <Card className="flex h-[40vh] md:h-[80vh] items-center justify-center p-4 text-sm text-muted-foreground">Selecciona una conversación para ver el detalle.</Card>
        )}
      </div>
    </div>
  );
}
