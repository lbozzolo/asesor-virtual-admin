"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsDashboard } from "@/components/metrics-dashboard";
import { LeadsTable } from "@/components/leads-table";
import { ChatTranscript } from "@/components/chat-transcript";
import type { Lead } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProtectedLayout } from "@/components/protected-layout";

const mockLeads: Lead[] = [
  {
    id: "1",
    customerName: "Alicia Johnson",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "David Chen",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Cualificado",
    lastContact: "Hace 2 días",
    transcript: [
      { sender: "user", text: "Hola, estoy interesada en el nuevo teléfono XYZ. ¿Puedes contarme más sobre sus características?", timestamp: "2024-07-28T10:00:00Z" },
      { sender: "advisor", text: "¡Hola Alicia! Por supuesto. El teléfono XYZ tiene una impresionante pantalla de 120Hz, un sistema de cámara de nivel profesional y una batería que dura todo el día. ¿Qué es lo más importante para ti en un teléfono?", timestamp: "2024-07-28T10:01:00Z" },
      { sender: "user", text: "La cámara es muy importante para mí. ¿Cómo se compara con otros modelos de gama alta?", timestamp: "2024-07-28T10:02:00Z" },
      { sender: "advisor", text: "Excelente pregunta. Sobresale en fotografía con poca luz y tiene un modo de retrato único que ha recibido excelentes críticas. Se considera uno de los 3 mejores del mercado en este momento.", timestamp: "2024-07-28T10:03:00Z" },
    ],
  },
  {
    id: "2",
    customerName: "Bob Williams",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "Sarah Miller",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Cerrado",
    lastContact: "Hace 1 semana",
    transcript: [
      { sender: "user", text: "Estoy buscando una nueva laptop para edición de video.", timestamp: "2024-07-21T14:30:00Z" },
      { sender: "advisor", text: "Hola Bob, tenemos algunas opciones geniales. La ProBook X1 es una potencia con una GPU dedicada que es perfecta para el trabajo de video. Es nuestra principal recomendación.", timestamp: "2024-07-21T14:31:00Z" },
      { sender: "user", text: "¿Cuál es el precio y la garantía?", timestamp: "2024-07-21T14:32:00Z" },
      { sender: "advisor", text: "Comienza en $1999 y viene con una garantía premium de 2 años. También tenemos un 10% de descuento esta semana.", timestamp: "2024-07-21T14:33:00Z" },
      { sender: "user", text: "¡Genial, me la llevo!", timestamp: "2024-07-21T14:35:00Z" },
    ],
  },
  {
    id: "3",
    customerName: "Charlie Brown",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "David Chen",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Potencial",
    lastContact: "Hace 5 horas",
    transcript: [
      { sender: "user", text: "¿Venden relojes inteligentes?", timestamp: "2024-07-28T18:00:00Z" },
      { sender: "advisor", text: "Sí, tenemos una amplia gama de relojes inteligentes. ¿Buscas algo para fitness, estilo o un poco de ambos?", timestamp: "2024-07-28T18:01:00Z" },
    ],
  },
  {
    id: "4",
    customerName: "Diana Prince",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "Sarah Miller",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Perdido",
    lastContact: "Hace 3 semanas",
    transcript: [
      { sender: "user", text: "Necesito una funda de teléfono duradera para mi teléfono.", timestamp: "2024-07-05T11:00:00Z" },
      { sender: "advisor", text: "Tenemos la serie Rhino que es extremadamente resistente. ¿Te gustaría ver las opciones?", timestamp: "2024-07-05T11:01:00Z" },
      { sender: "user", text: "Es un poco más caro de lo que pensaba. Buscaré en otro lado, gracias.", timestamp: "2024-07-05T11:05:00Z" },
    ],
  },
];

export default function DashboardPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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
            <LeadsTable leads={mockLeads} onViewLead={handleViewLead} />
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
                <ChatTranscript lead={selectedLead} />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ProtectedLayout>
  );
}
