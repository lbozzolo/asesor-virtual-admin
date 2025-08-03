import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Lead, Message } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";


type ChatTranscriptProps = {
  lead: Lead;
  transcript: Message[];
  loading: boolean;
};

const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    try {
        let date: Date;
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } 
        else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        }
        else if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
             date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
        }
        else {
            return '';
        }
        
        if (isNaN(date.getTime())) {
            return '';
        }

        return format(date, "PPpp", { locale: es });
    } catch (error) {
        console.error("Error formatting timestamp:", error, "with value:", timestamp);
        return '';
    }
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

  return (
    <div className="space-y-6">
      {transcript.map((message: Message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-3",
            message.sender === "user" ? "justify-start" : "justify-end"
          )}
        >
          {message.sender === "user" && (
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={lead.customerAvatar} alt={lead.customerName} data-ai-hint="person portrait" />
              <AvatarFallback>{getInitials(lead.customerName)}</AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              "max-w-[75%] rounded-lg p-3 text-sm",
              message.sender === "user"
                ? "bg-muted"
                : "bg-primary text-primary-foreground"
            )}
          >
            <p className="mb-1">{message.text || "Mensaje no disponible"}</p>
            <p className={cn("text-xs", message.sender === 'user' ? 'text-muted-foreground' : 'text-primary-foreground/70')}>
                {formatTimestamp(message.timestamp)}
            </p>
          </div>
          {message.sender === "advisor" && (
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={lead.advisorAvatar} alt={lead.advisorName} data-ai-hint="person professional" />
              <AvatarFallback>{getInitials(lead.advisorName)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
    </div>
  );
}
