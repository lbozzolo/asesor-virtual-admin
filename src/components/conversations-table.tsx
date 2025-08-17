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
  customerData?: {
    fullName?: string;
    firstName?: string;
    email?: string;
    phone?: string;
  };
  leadCapture?: {
    requested?: boolean;
    completed?: boolean;
    completedAt?: any;
    method?: string;
  };
}

interface Props {
  conversations: ConversationRow[];
  loading: boolean;
}

export function ConversationsTable({ conversations, loading }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = conversations.find(c => c.id === selectedId);
  // Map de resúmenes por conversación: id -> { text, error }
  const [summaries, setSummaries] = useState<Record<string, { text: string; error?: string }>>({});
  // id actualmente en proceso de resumen
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const summary = selectedId ? summaries[selectedId]?.text || null : null;
  const summaryError = selectedId ? summaries[selectedId]?.error || null : null;
  const summarizing = summarizingId === selectedId;

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
    const id = selected.id;
    setSummarizingId(id);
    // limpiar estado previo de ese id
    setSummaries(prev => ({ ...prev, [id]: { text: '' } }));
    try {
      const resp = await fetch('/api/summarize-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: selected.messages || [] })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Fallo al resumir');
      setSummaries(prev => ({ ...prev, [id]: { text: data.summary } }));
    } catch (e: any) {
      setSummaries(prev => ({ ...prev, [id]: { text: '', error: e.message } }));
    } finally {
      setSummarizingId(null);
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
          <div key={map.key} className="flex gap-2 rounded-md bg-neutral-800/80 border border-neutral-700 px-3 py-2 shadow-sm">
            <div className={`mt-0.5 ${map.color}`}><Icon className="h-4 w-4" /></div>
            <div className="text-xs leading-relaxed">
              <p className="font-semibold tracking-wide text-[11px] uppercase text-neutral-200">{map.label}</p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-neutral-100">{value}</p>
            </div>
          </div>
        );
      }
      return <div key={raw} className="text-xs whitespace-pre-wrap break-words px-3 py-2 rounded bg-neutral-800/60 border border-neutral-700 text-neutral-100">{raw}</div>;
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
                const inferredName = c.customerData?.fullName || c.customerData?.firstName;
                const customerName = inferredName || firstUserMsg?.text?.slice(0, 25) || 'Cliente';
                return (
                  <tr key={c.id} className={`cursor-pointer hover:bg-muted/40 ${selectedId === c.id ? 'bg-muted/60' : ''}`} onClick={() => setSelectedId(c.id)}>
                    <td className="p-2 font-medium">{customerName}</td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        <span>{c.status || '—'}</span>
                        {c.leadCapture?.completed && (
                          <span className="inline-block w-fit text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-medium tracking-wide uppercase">Capturado</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">{c.createdAt?.toDate ? format(c.createdAt.toDate(), 'dd/MM HH:mm', { locale: es }) : '—'}</td>
                    <td className="p-2 text-center">{c.messages?.length || 0}</td>
                  </tr>
                );
              })}
            </tbody>
        </table>
        <p className="text-xs text-muted-foreground sticky bottom-0 bg-background/90 backdrop-blur pt-2 pb-1 mt-2 border-t">Pulsa una fila para ver el transcript. Usa Exportar para descargar un resumen.</p>
      </div>
      {/* Columna derecha: ahora dividida en Transcript (izq) + Info Panel (der) */}
      <div className="md:sticky md:top-4 self-start h-[80vh] border rounded-md flex overflow-hidden">
        {selected ? (
          <>
            {/* Transcript */}
            <div className="flex-1 flex flex-col bg-background/50">
              <div className="border-b px-3 py-2 flex items-center justify-between">
                <div className="text-xs font-medium truncate">
                  {(selected as any).customerData?.fullName || (selected as any).customerData?.firstName || 'Cliente'}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="uppercase tracking-wide opacity-70">{selected.status || '—'}</span>
                  {(selected as any).leadCapture?.completed && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-600 text-white font-semibold">Capturado</span>
                  )}
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
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
              </ScrollArea>
            </div>
            {/* Info Panel (scrollable completo) */}
            <ScrollArea className="w-80 border-l bg-neutral-900/90 border-neutral-800 backdrop-blur-sm relative text-neutral-200">
              <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_70%_20%,theme(colors.emerald.600)/25,transparent_60%)]" />
              <div className="p-3 border-b border-neutral-800 relative">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-300 mb-2">Datos</h3>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div>
                    <p className="text-[10px] uppercase opacity-50 tracking-wide">Cliente</p>
                    <p className="font-medium break-words text-neutral-100">{(selected as any).customerData?.fullName || (selected as any).customerData?.firstName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-50 tracking-wide">Estado</p>
                    <p className="flex items-center gap-2 text-neutral-200">{selected.status || '—'} {(selected as any).leadCapture?.completed && <span className="inline-block text-[10px] px-1 py-0.5 rounded bg-emerald-600 text-white shadow-sm">Capturado</span>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-50 tracking-wide">Creada</p>
                    <p className="text-neutral-300">{selected.createdAt?.toDate ? format(selected.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase opacity-50 tracking-wide">ID</p>
                    <p className="font-mono text-[11px] break-all text-neutral-400">{selected.id}</p>
                  </div>
                  {(selected as any).customerData?.email && (
                    <div>
                      <p className="text-[10px] uppercase opacity-50 tracking-wide">Email</p>
                      <p className="break-words text-neutral-300">{(selected as any).customerData.email}</p>
                    </div>
                  )}
                  {(selected as any).customerData?.phone && (
                    <div>
                      <p className="text-[10px] uppercase opacity-50 tracking-wide">Teléfono</p>
                      <p className="text-neutral-300">{(selected as any).customerData.phone}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 border-b border-neutral-800 relative">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-300 mb-2">Resumen IA</h3>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <button
                    onClick={handleSummarize}
                    disabled={summarizing}
                    className="px-2 py-1 text-[11px] rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >{summarizing ? 'Generando…' : 'Generar'}</button>
                  {summary && summary.length > 0 && (
                    <button
                      onClick={() => summary && navigator.clipboard.writeText(summary)}
                      className="px-2 py-1 text-[11px] border rounded-md hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                    >Copiar</button>
                  )}
                  {summary && summary.length > 0 && (
                    <button
                      onClick={() => { if (selectedId) setSummaries(prev => { const copy = { ...prev }; delete copy[selectedId]; return copy; }); }}
                      className="px-2 py-1 text-[11px] border rounded-md hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                    >Borrar</button>
                  )}
                </div>
                {summaryError && <p className="text-[10px] text-red-400 mb-2">{summaryError}</p>}
                <div className="space-y-2 pr-1">
                  {summary && summary.length > 0 ? formattedSummary : (
                    <p className="text-[10px] text-neutral-500">No generado aún.</p>
                  )}
                </div>
              </div>
              <div className="p-3 text-[10px] text-neutral-500 border-t border-neutral-800">
                Panel de información — más datos próximamente.
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Selecciona una conversación para ver el detalle.</div>
        )}
      </div>
    </div>
  );
}
