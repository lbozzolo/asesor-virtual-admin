"use client";

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types';
import { AppHeader } from './app-header';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
       <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
             <Skeleton className="h-6 w-48" />
             <div className="ml-auto">
                <Skeleton className="h-8 w-8 rounded-full" />
             </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
             <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
             </div>
          </main>
       </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
  if (!appUser || !allowedRoles.includes(appUser.role)) {
     router.push('/dashboard'); 
     return (
        <div className="flex h-screen w-full items-center justify-center">
          <p>No tienes permiso para ver esta página. Redirigiendo...</p>
        </div>
     );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      {children}
    </div>
  );
}
