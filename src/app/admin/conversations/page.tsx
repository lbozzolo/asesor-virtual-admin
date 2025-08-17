"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { ProtectedLayout } from '@/components/protected-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ConversationsTable } from '@/components/conversations-table';
import type { Message } from '@/types';

interface ConversationDoc {
  id: string;
  advisorName?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  messages?: Message[];
  customerData?: {
    nombre?: string;
    email?: string;
    telefono?: string;
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationDoc[]>([]); // datos de la página actual
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  // Eliminado filtro de asesor (asesor ficticio)
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, DocumentSnapshot | null>>({ 1: null }); // cursor anterior a la página
  const [pageData, setPageData] = useState<Record<number, ConversationDoc[]>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<number, boolean>>({}); // si esa página tiene sucesor

  const fetchPage = useCallback(async (page: number) => {
    // Si ya la tenemos cacheada, úsala
    if (pageData[page]) {
      setConversations(pageData[page]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const prevCursor = pageCursors[page];
      const constraints: any[] = [orderBy('createdAt', 'desc')];
      if (prevCursor) constraints.push(startAfter(prevCursor));
      constraints.push(limit(PAGE_SIZE));
      const q = query(collection(db, 'conversations'), ...constraints);
      const snap = await getDocs(q);
      const data: ConversationDoc[] = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any;
      // Guardar datos de la página
      setPageData(prev => ({ ...prev, [page]: data }));
      setConversations(data);
      // Preparar cursor para página siguiente (page+1) = último doc de esta página
      const last = snap.docs[snap.docs.length - 1] || null;
      setPageCursors(prev => ({ ...prev, [page + 1]: last }));
      setHasMoreMap(prev => ({ ...prev, [page]: snap.size === PAGE_SIZE }));
    } catch (e) {
      console.error('Error obteniendo página de conversaciones', e);
    } finally {
      setLoading(false);
    }
  }, [PAGE_SIZE, pageCursors, pageData]);

  // Carga inicial (página 1)
  const initialLoaded = useRef(false);
  useEffect(() => {
    if (!initialLoaded.current) {
      initialLoaded.current = true;
      fetchPage(1);
    }
  }, [fetchPage]);

  // Cambios de filtros invalidan cache y reinician a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter(c => {
      const name = c.customerData?.nombre || '';
      const email = c.customerData?.email || '';
      const phone = c.customerData?.telefono || '';
      const status = c.status || '';
      let createdStr = '';
      let sameDay = true;
      try {
        const d = c.createdAt?.toDate ? c.createdAt.toDate() : (c.createdAt?._seconds ? new Date(c.createdAt._seconds * 1000) : null);
        if (d) {
          const iso = d.toISOString();
          const ymd = iso.slice(0,10); // YYYY-MM-DD
          const dmy = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
          createdStr = `${iso} ${ymd} ${dmy}`;
          if (dateFilter) {
            sameDay = d.getFullYear() === dateFilter.getFullYear() && d.getMonth() === dateFilter.getMonth() && d.getDate() === dateFilter.getDate();
          }
        }
      } catch {}
      const bucket = [name, email, phone, status, createdStr].join(' ').toLowerCase();
      const matchesSearch = !q || bucket.includes(q);
      const matchesStatus = !statusFilter || status === statusFilter;
      const matchesDate = !dateFilter || sameDay;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [conversations, search, statusFilter, dateFilter]);

  // Eliminado distinctAdvisors (no se usa)

  return (
    <ProtectedLayout allowedRoles={["operador","admin","superadmin"]}>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Conversaciones</CardTitle>
            <CardDescription>Monitorea las conversaciones activas con clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-end md:flex-wrap">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Buscar texto</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en mensajes..." className="w-full border rounded-md px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Estado</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
                  <option value="">Todos</option>
                  <option value="Iniciado">Iniciado</option>
                  <option value="Potencial">Potencial</option>
                  <option value="Cualificado">Cualificado</option>
                  <option value="Cerrado">Cerrado</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Fecha</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] h-8 px-2 justify-start text-left text-sm font-normal">
                      {dateFilter ? format(dateFilter, 'dd/MM/yyyy') : 'Cualquier fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter ?? undefined}
                      onSelect={(d) => setDateFilter(d ?? null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="border rounded-md px-3 py-1 text-xs font-medium hover:bg-muted">Limpiar</button>
              </div>
              {dateFilter && (
                <div>
                  <button onClick={() => setDateFilter(null)} className="border rounded-md px-3 py-1 text-xs font-medium hover:bg-muted">Quitar fecha</button>
                </div>
              )}
            </div>
            <ConversationsTable conversations={filtered} loading={loading} />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {/* Botón anterior */}
              <button
                onClick={() => { const prev = currentPage - 1; if (prev >= 1) { setCurrentPage(prev); fetchPage(prev); } }}
                disabled={currentPage === 1 || loading}
                className="px-2 py-1 text-xs border rounded-md disabled:opacity-40"
              >Anterior</button>
              {/* Números de página cargados */}
              {Array.from({ length: Object.keys(pageData).length || 1 }).map((_, i) => {
                const pageNum = i + 1;
                const active = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => { setCurrentPage(pageNum); fetchPage(pageNum); }}
                    className={`min-w-8 px-2 py-1 text-xs rounded-md border ${active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                  >{pageNum}</button>
                );
              })}
              {/* Botón siguiente */}
              <button
                onClick={() => { const next = currentPage + 1; if (hasMoreMap[currentPage]) { setCurrentPage(next); fetchPage(next); } }}
                disabled={!hasMoreMap[currentPage] || loading}
                className="px-2 py-1 text-xs border rounded-md disabled:opacity-40"
              >Siguiente</button>
            </div>
          </CardContent>
        </Card>
      </main>
    </ProtectedLayout>
  );
}
