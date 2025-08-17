"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter, DocumentSnapshot, where } from 'firebase/firestore';
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
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationDoc[]>([]); // datos de la página actual
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  // Eliminado filtro de asesor (asesor ficticio)
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  // Filtro unificado de captura
  const [captureFilter, setCaptureFilter] = useState<'all' | 'any' | 'requested' | 'completed'>('all');
  const [indexHintUrl, setIndexHintUrl] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, DocumentSnapshot | null>>({ 1: null }); // cursor anterior a la página
  const [pageData, setPageData] = useState<Record<number, ConversationDoc[]>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<number, boolean>>({}); // si esa página tiene sucesor

  const fetchPage = useCallback(async (page: number) => {
    // Cache reutilizable sólo dentro del mismo captureFilter
    if (pageData[page]) {
      setConversations(pageData[page]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const prevCursor = pageCursors[page];
      const constraints: any[] = [];
      // server-side filtering principal
      let data: ConversationDoc[] = [];
      if (captureFilter === 'any') {
        // Combinar completadas y sólo solicitadas mediante dos queries (sin OR nativo)
        const baseCol = collection(db,'conversations');
        const commonOrder: any[] = [orderBy('createdAt','desc')];
        // Nota: paginación combinada simple: se ignora cursor cross-set (suficiente para tamaño pequeño inicial)
        const qCompleted = query(baseCol, where('leadCapture.completed','==', true), ...commonOrder, limit(PAGE_SIZE));
        const qRequested = query(baseCol, where('leadCapture.requested','==', true), ...commonOrder, limit(PAGE_SIZE));
        const [snapCompleted, snapRequested] = await Promise.all([getDocs(qCompleted), getDocs(qRequested)]);
        const map: Record<string, ConversationDoc> = {};
        for (const d of [...snapCompleted.docs, ...snapRequested.docs]) {
          const obj = { id: d.id, ...d.data() } as any;
          map[d.id] = obj; // dedupe
        }
        data = Object.values(map).sort((a,b) => {
          const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dbt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dbt - da;
        }).slice(0,PAGE_SIZE);
      } else {
        if (captureFilter === 'completed') {
          constraints.push(where('leadCapture.completed','==', true));
        } else if (captureFilter === 'requested') {
          constraints.push(where('leadCapture.requested','==', true));
        }
        constraints.push(orderBy('createdAt','desc'));
        if (prevCursor) constraints.push(startAfter(prevCursor));
        constraints.push(limit(PAGE_SIZE));
        const q = query(collection(db,'conversations'), ...constraints);
        const snap = await getDocs(q);
        data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any;
      }
      // filtro adicional client-side para 'requested' estricto (excluir completadas)
      if (captureFilter === 'requested') {
        data = data.filter(c => (c as any).leadCapture?.requested && !(c as any).leadCapture?.completed);
      }
      setPageData(prev => ({ ...prev, [page]: data }));
      setConversations(data);
      // Paginación: para 'any' simplificada (no cross-cursor mixing). Marcamos hasMore si alcanza PAGE_SIZE.
      if (captureFilter === 'any') {
        setHasMoreMap(prev => ({ ...prev, [page]: data.length === PAGE_SIZE }));
      } else {
        const last = (data as any)[data.length - 1]?._ref || null; // no fiable; omitimos cursor real personalizado
        setPageCursors(prev => ({ ...prev, [page + 1]: last }));
        setHasMoreMap(prev => ({ ...prev, [page]: data.length === PAGE_SIZE }));
      }
      setIndexHintUrl(null);
      setQueryError(null);
    } catch (e: any) {
      console.error('Error obteniendo página de conversaciones', e);
      setQueryError(e.message || 'Error desconocido');
      if (typeof e.message === 'string') {
        const match = e.message.match(/https?:\/\/console\.firebase\.google\.com[^\s)]+/);
        if (match) setIndexHintUrl(match[0]);
      }
      // Fallback sin orderBy si falta índice y estamos filtrando
      if (e.code === 'failed-precondition' && captureFilter !== 'all') {
        try {
          const fbConstraints: any[] = [];
          if (captureFilter === 'completed') fbConstraints.push(where('leadCapture.completed','==',true));
          else fbConstraints.push(where('leadCapture.requested','==',true));
          if (pageCursors[page]) fbConstraints.push(startAfter(pageCursors[page]));
          fbConstraints.push(limit(PAGE_SIZE));
          const q2 = query(collection(db,'conversations'), ...fbConstraints);
          const snap2 = await getDocs(q2);
          let data2: ConversationDoc[] = snap2.docs.map(d => ({ id: d.id, ...d.data() })) as any;
          if (captureFilter === 'requested') {
            data2 = data2.filter(c => (c as any).leadCapture?.requested && !(c as any).leadCapture?.completed);
          }
          setPageData(prev => ({ ...prev, [page]: data2 }));
          setConversations(data2);
          const last2 = snap2.docs[snap2.docs.length - 1] || null;
          setPageCursors(prev => ({ ...prev, [page + 1]: last2 }));
          setHasMoreMap(prev => ({ ...prev, [page]: snap2.size === PAGE_SIZE }));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [PAGE_SIZE, pageCursors, pageData, captureFilter]);

  // Carga inicial (página 1)
  const initialLoaded = useRef(false);
  useEffect(() => {
    if (!initialLoaded.current) {
      initialLoaded.current = true;
      fetchPage(1);
    }
  }, [fetchPage]);

  // Cambio de captureFilter invalida cache completa y recarga
  useEffect(() => {
    setCurrentPage(1);
    setPageCursors({ 1: null });
    setPageData({});
    setHasMoreMap({});
    setConversations([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchPage(1);
  }, [captureFilter]);

  // Cambios de filtros invalidan cache y reinician a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter(c => {
  const name = c.customerData?.fullName || c.customerData?.firstName || '';
  const email = c.customerData?.email || '';
  const phone = c.customerData?.phone || '';
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
              <div>
                <label className="block text-xs font-medium mb-1">Estado de captura</label>
                <select
                  value={captureFilter}
                  onChange={e => setCaptureFilter(e.target.value as any)}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  <option value="all">Todas</option>
                  <option value="any">Con captura (solicitadas o completadas)</option>
                  <option value="requested">Sólo solicitadas</option>
                  <option value="completed">Sólo completadas</option>
                </select>
              </div>
              {dateFilter && (
                <div>
                  <button onClick={() => setDateFilter(null)} className="border rounded-md px-3 py-1 text-xs font-medium hover:bg-muted">Quitar fecha</button>
                </div>
              )}
            </div>
            {indexHintUrl && (
              <div className="mb-3 p-2 border rounded-md bg-amber-50 text-amber-800 text-xs">
                Necesitas crear un índice compuesto para esta consulta. Abre: <a className="underline" href={indexHintUrl} target="_blank" rel="noreferrer">Crear índice</a>
              </div>
            )}
            {queryError && !indexHintUrl && (
              <div className="mb-3 p-2 border rounded-md bg-red-50 text-red-700 text-xs">
                {queryError}
              </div>
            )}
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
