"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsDashboard } from "@/components/metrics-dashboard";
import { LeadsTable } from "@/components/leads-table";
import { ChatTranscript } from "@/components/chat-transcript";
import type { Lead } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const mockLeads: Lead[] = [
  {
    id: "1",
    customerName: "Alice Johnson",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "David Chen",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Qualified",
    lastContact: "2 days ago",
    transcript: [
      { sender: "user", text: "Hi, I'm interested in the new XYZ phone. Can you tell me more about its features?", timestamp: "2024-07-28T10:00:00Z" },
      { sender: "advisor", text: "Hello Alice! Of course. The XYZ phone has a stunning 120Hz display, a pro-grade camera system, and all-day battery life. What's most important to you in a phone?", timestamp: "2024-07-28T10:01:00Z" },
      { sender: "user", text: "The camera is a big deal for me. How does it compare to other flagship models?", timestamp: "2024-07-28T10:02:00Z" },
      { sender: "advisor", text: "Great question. It excels in low-light photography and has a unique portrait mode that has been getting rave reviews. It's considered one of the top 3 on the market right now.", timestamp: "2024-07-28T10:03:00Z" },
    ],
  },
  {
    id: "2",
    customerName: "Bob Williams",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "Sarah Miller",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Closed",
    lastContact: "1 week ago",
    transcript: [
      { sender: "user", text: "I'm looking for a new laptop for video editing.", timestamp: "2024-07-21T14:30:00Z" },
      { sender: "advisor", text: "Hi Bob, we have some great options. The ProBook X1 is a powerhouse with a dedicated GPU that's perfect for video work. It's our top recommendation.", timestamp: "2024-07-21T14:31:00Z" },
      { sender: "user", text: "Sounds good. What's the price and warranty?", timestamp: "2024-07-21T14:32:00Z" },
      { sender: "advisor", text: "It starts at $1999 and comes with a 2-year premium warranty. We also have a 10% discount this week.", timestamp: "2024-07-21T14:33:00Z" },
      { sender: "user", text: "Awesome, I'll take it!", timestamp: "2024-07-21T14:35:00Z" },
    ],
  },
  {
    id: "3",
    customerName: "Charlie Brown",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "David Chen",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Lead",
    lastContact: "5 hours ago",
    transcript: [
      { sender: "user", text: "Do you sell smart watches?", timestamp: "2024-07-28T18:00:00Z" },
      { sender: "advisor", text: "Yes, we have a wide range of smart watches. Are you looking for something for fitness, style, or a bit of both?", timestamp: "2024-07-28T18:01:00Z" },
    ],
  },
  {
    id: "4",
    customerName: "Diana Prince",
    customerAvatar: "https://placehold.co/100x100.png",
    advisorName: "Sarah Miller",
    advisorAvatar: "https://placehold.co/100x100.png",
    status: "Lost",
    lastContact: "3 weeks ago",
    transcript: [
      { sender: "user", text: "I need a durable phone case for my phone.", timestamp: "2024-07-05T11:00:00Z" },
      { sender: "advisor", text: "We have the Rhino series which is extremely tough. Would you like to see the options?", timestamp: "2024-07-05T11:01:00Z" },
      { sender: "user", text: "It's a bit more expensive than I thought. I'll look elsewhere, thanks.", timestamp: "2024-07-05T11:05:00Z" },
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
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Advisor Insights</h1>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
            <span className="sr-only">User Menu</span>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <MetricsDashboard />
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
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
                <SheetTitle>Conversation with {selectedLead.customerName}</SheetTitle>
                <SheetDescription>
                  Advisor: {selectedLead.advisorName} | Status: {selectedLead.status}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 px-6 py-4">
                <ChatTranscript lead={selectedLead} />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
