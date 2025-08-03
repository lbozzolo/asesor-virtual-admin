import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Lead, Message } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";


type ChatTranscriptProps = {
  lead: Lead;
  transcript: Message[];
  loading: boolean;
};

export function ChatTranscript({ lead, transcript, loading }: ChatTranscriptProps) {
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 justify-start">
            <Skeleton className="h-8 w-8 rounded-full border" />
            <Skeleton className="h-20 w-3/4 rounded-lg" />
        </div>
        <div className="flex items-start gap-3 justify-end">
            <Skeleton className="h-16 w-3/4 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full border" />
        </div>
        <div className="flex items-start gap-3 justify-start">
            <Skeleton className="h-8 w-8 rounded-full border" />
            <Skeleton className="h-12 w-1/2 rounded-lg" />
        </div>
      </div>
    )
  }
  
  if (!transcript || transcript.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-10">
              <p>No se encontraron messages para esta conversación.</p>
              <p className="text-xs mt-2">Es posible que la conversación recién haya comenzado.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      {transcript.map((message, index) => {
        const sender = message.role === 'user' ? 'user' : 'advisor';
        return (
            <div
                key={index}
                className={cn(
                    "flex items-start gap-3",
                    sender === "user" ? "justify-start" : "justify-end"
                )}
            >
            {sender === "user" && (
                <Avatar className="h-8 w-8 border">
                <AvatarImage src={lead.customerAvatar} alt={lead.customerName} data-ai-hint="person portrait" />
                <AvatarFallback>{getInitials(lead.customerName)}</AvatarFallback>
                </Avatar>
            )}
            <div
                className={cn(
                "max-w-[75%] rounded-lg p-3 text-sm",
                sender === "user"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                )}
            >
                <p>{message.text || "Mensaje no disponible"}</p>
            </div>
            {sender === "advisor" && (
                <Avatar className="h-8 w-8 border">
                <AvatarImage src={lead.advisorAvatar} alt={lead.advisorName} data-ai-hint="person professional" />
                <AvatarFallback>{getInitials(lead.advisorName)}</AvatarFallback>
                </Avatar>
            )}
            </div>
        )
      })}
    </div>
  );
}
