"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye } from "lucide-react";
import type { Lead } from "@/types";

type LeadsTableProps = {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
};

export function LeadsTable({ leads, onViewLead }: LeadsTableProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getStatusVariant = (status: Lead['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Closed":
        return "default";
      case "Qualified":
        return "secondary";
      case "Lost":
        return "destructive";
      case "Lead":
      default:
        return "outline";
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Advisor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Last Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={lead.customerAvatar} alt={lead.customerName} data-ai-hint="person portrait" />
                    <AvatarFallback>{getInitials(lead.customerName)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{lead.customerName}</div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{lead.advisorName}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(lead.status)} className="capitalize">
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">{lead.lastContact}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onViewLead(lead)}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Conversation</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
