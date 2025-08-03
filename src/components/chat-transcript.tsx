import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Lead, Message } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


type ChatTranscriptProps = {
  lead: Lead;
};

const formatTimestamp = (timestamp: string | Timestamp): string => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return format(date, "PPpp", { locale: es });
};


export function ChatTranscript({ lead }: ChatTranscriptProps) {
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {lead.transcript.map((message: Message, index: number) => (
        <div
          key={index}
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
            <p className="mb-1">{message.text}</p>
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
