import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

type ChatTranscriptProps = {
  lead: Lead;
};

export function ChatTranscript({ lead }: ChatTranscriptProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {lead.transcript.map((message, index) => (
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
            <p>{message.text}</p>
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
