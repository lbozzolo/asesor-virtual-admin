"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Users, BarChart, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { appUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };
  
  const canManageUsers = appUser?.role === 'admin' || appUser?.role === 'superadmin';
  const canViewConversations = !!appUser && ['operador','admin','superadmin'].includes(appUser.role);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <h1 className="text-xl font-semibold tracking-tight">
        <Link href="/dashboard">
          Información del Asesor
        </Link>
      </h1>

      <nav className="ml-6 hidden md:flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <BarChart className="h-4 w-4" />
            Dashboard
        </Link>
        {canViewConversations && (
            <Link href="/admin/conversations" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <MessageSquare className="h-4 w-4" />
              Conversaciones
            </Link>
        )}
        {canManageUsers && (
             <Link href="/admin/users" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <Users className="h-4 w-4" />
                Gestión de Usuarios
            </Link>
        )}
      </nav>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Menú de Usuario</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p>Mi Cuenta</p>
              <p className="text-xs font-normal text-muted-foreground">
                {appUser?.email}
              </p>
              <p className="text-xs font-normal text-muted-foreground capitalize">
                Rol: {appUser?.role}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                <BarChart className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
            </DropdownMenuItem>
            {canViewConversations && (
              <DropdownMenuItem onClick={() => router.push('/admin/conversations')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Conversaciones</span>
              </DropdownMenuItem>
            )}
             {canManageUsers && (
                <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Gestión de Usuarios</span>
                </DropdownMenuItem>
             )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
