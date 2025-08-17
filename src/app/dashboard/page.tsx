
"use client";

import { useState, useEffect } from "react";
import { collection, query, Timestamp, orderBy, limit, getDocs, startAfter, DocumentSnapshot } from "firebase/firestore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsDashboard } from "@/components/metrics-dashboard";
import { LeadsTable } from "@/components/leads-table";
import { ChatTranscript } from "@/components/chat-transcript";
import type { Lead, Message } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProtectedLayout } from "@/components/protected-layout";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const PAGE_SIZE = 15;
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const mapDocs = (docs: any[]) => docs.map(doc => {
    const data = doc.data();
    let lastContactDate: Date;
    const contactTimestamp = data.updatedAt || data.createdAt;
    if (contactTimestamp instanceof Timestamp) {
      lastContactDate = contactTimestamp.toDate();
    } else if (typeof contactTimestamp === 'string' && contactTimestamp) {
      lastContactDate = new Date(contactTimestamp);
    } else if (contactTimestamp && typeof contactTimestamp.toDate === 'function') {
      lastContactDate = contactTimestamp.toDate();
    } else {
      lastContactDate = new Date();
    }
    const customerName = data.customerData?.nombre || 'Nombre no disponible';
    return {
      id: doc.id,
      customerName,
      customerAvatar: 'https://placehold.co/100x100.png',
      advisorName: data.advisorName || 'Asesor no asignado',
      advisorAvatar: 'https://placehold.co/100x100.png',
      status: data.status || 'Iniciado',
      lastContact: formatDistanceToNow(lastContactDate, { addSuffix: true, locale: es }),
      messages: data.messages || [],
    } as Lead;
  });

  const loadPage = async (next = false) => {
    if (next && (!hasMore || loadingMore)) return;
    try {
      if (next) setLoadingMore(true); else setLoading(true);
  const constraints: any[] = [orderBy('createdAt', 'desc')];
  if (next && lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(PAGE_SIZE));
  const q = query(collection(db, 'conversations'), ...constraints);
      const snap = await getDocs(q);
      const newLeads = mapDocs(snap.docs);
      if (next) setLeads(prev => [...prev, ...newLeads]); else setLeads(newLeads);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.size === PAGE_SIZE);
    } catch (e) {
      console.error('Error paginando conversaciones en dashboard', e);
    } finally {
      if (next) setLoadingMore(false); else setLoading(false);
    }
  };

  useEffect(() => { loadPage(false); }, []);

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCloseSheet = () => {
    setSelectedLead(null);
  };

  return (
    <ProtectedLayout allowedRoles={['superadmin', 'admin', 'operador']}>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <MetricsDashboard />
        <Card>
          <CardHeader>
            <CardTitle>Clientes Potenciales Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsTable leads={leads} onViewLead={handleViewLead} loading={loading} />
            <div className="mt-4 flex justify-center">
              {hasMore && !loading && (
                <button
                  onClick={() => loadPage(true)}
                  disabled={loadingMore}
                  className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-50"
                >{loadingMore ? 'Cargando...' : 'Cargar más'}</button>
              )}
              {!hasMore && !loading && (
                <p className="text-xs text-muted-foreground">No hay más registros.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Sheet open={!!selectedLead} onOpenChange={(isOpen) => !isOpen && handleCloseSheet()}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
          {selectedLead && (
            <>
              <SheetHeader className="px-6 pt-6">
                <SheetTitle>Conversación con {selectedLead.customerName}</SheetTitle>
                <SheetDescription>
                  Asesor: {selectedLead.advisorName} | Estado: {selectedLead.status}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 px-6 py-4">
                <ChatTranscript 
                  lead={selectedLead} 
                  transcript={selectedLead.messages} 
                  loading={false}
                />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ProtectedLayout>
  );
}
