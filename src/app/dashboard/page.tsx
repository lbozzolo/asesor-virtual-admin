"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot, query, Timestamp, orderBy } from "firebase/firestore";
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
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "conversations"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        let lastContactDate: Date;
        if (data.lastContact instanceof Timestamp) {
            lastContactDate = data.lastContact.toDate();
        } else if (typeof data.lastContact === 'string' && data.lastContact) {
            lastContactDate = new Date(data.lastContact);
        } else {
            // Si no hay fecha de último contacto, podemos usar la fecha en que se creó el documento, si existe.
            // Si no, usamos la fecha actual como último recurso.
            lastContactDate = doc.createTime ? doc.createTime.toDate() : new Date();
        }
          
        return {
          id: doc.id,
          customerName: data.customerName || "Nombre no disponible",
          customerAvatar: data.customerAvatar || `https://placehold.co/100x100.png`,
          advisorName: data.advisorName || "Asesor no asignado",
          advisorAvatar: data.advisorAvatar || `https://placehold.co/100x100.png`,
          status: data.status || "Potencial",
          lastContact: formatDistanceToNow(lastContactDate, { addSuffix: true, locale: es }),
        } as Lead;
      });
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
        console.error("Error al obtener datos de Firestore:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!selectedLead) {
        setTranscript([]);
        return;
    }

    setTranscriptLoading(true);
    const messagesRef = collection(db, "conversations", selectedLead.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        setTranscript(messagesData);
        setTranscriptLoading(false);
    }, (error) => {
        console.error("Error al obtener mensajes de la subcolección:", error);
        setTranscript([]);
        setTranscriptLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedLead]);


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
                  transcript={transcript} 
                  loading={transcriptLoading} 
                />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ProtectedLayout>
  );
}
