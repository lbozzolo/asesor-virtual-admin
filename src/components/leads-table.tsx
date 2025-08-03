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
import { Skeleton } from "@/components/ui/skeleton";

type LeadsTableProps = {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
  loading: boolean;
};

export function LeadsTable({ leads, onViewLead, loading }: LeadsTableProps) {
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('');
  };

  const getStatusVariant = (status: Lead['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Cerrado":
        return "default";
      case "Cualificado":
        return "secondary";
      case "Perdido":
        return "destructive";
      case "Potencial":
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
        <div className="w-full overflow-x-auto">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Asesor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Último Contacto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Asesor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden md:table-cell">Último Contacto</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
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
                  <span className="sr-only">Ver Conversación</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
