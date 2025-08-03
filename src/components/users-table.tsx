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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { AppUser, UserRole } from "@/types";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { firebaseApp } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

type UsersTableProps = {
  users: AppUser[];
  onEditUser: (user: AppUser) => void;
  loading: boolean;
};

export function UsersTable({ users, onEditUser, loading }: UsersTableProps) {
  const { appUser: currentUser } = useAuth();
  const { toast } = useToast();
  const functions = getFunctions(firebaseApp);

  const handleToggleSuspend = async (userToSuspend: AppUser) => {
    if (currentUser?.uid === userToSuspend.uid) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "No puedes suspenderte a ti mismo." });
        return;
    }
    const toggleSuspendUser = httpsCallable(functions, 'toggleUserSuspension');
    try {
      await toggleSuspendUser({ uid: userToSuspend.uid, suspend: !userToSuspend.suspended });
      toast({
        title: "Éxito",
        description: `Usuario ${userToSuspend.suspended ? 'reactivado' : 'suspendido'} correctamente.`,
      });
    } catch (error: any) {
      console.error("Error al cambiar estado de suspensión:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getRoleVariant = (role: UserRole) => {
    switch(role) {
        case 'superadmin': return 'destructive';
        case 'admin': return 'secondary';
        case 'operador': return 'outline';
        default: return 'default';
    }
  }

  const roleHierarchy: Record<UserRole, number> = {
    operador: 1,
    admin: 2,
    superadmin: 3,
  };

  const canPerformAction = (targetUser: AppUser) => {
    if (!currentUser) return false;
    const currentUserLevel = roleHierarchy[currentUser.role];
    const targetUserLevel = roleHierarchy[targetUser.role];
    return currentUserLevel > targetUserLevel;
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
             ))
          ) : (
          users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleVariant(user.role)} className="capitalize">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                 <Badge variant={user.suspended ? 'destructive' : 'default'}>
                    {user.suspended ? <XCircle className="mr-1 h-3 w-3" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                    {user.suspended ? 'Suspendido' : 'Activo'}
                 </Badge>
              </TableCell>
              <TableCell className="text-right">
                {currentUser?.uid !== user.uid && canPerformAction(user) && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Más acciones</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Rol
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleSuspend(user)}>
                            {user.suspended ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                            {user.suspended ? 'Reactivar' : 'Suspender'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>
    </div>
  );
}
