"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import LoginPage from '../login/page';

export default function AdminEntryPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/admin/conversations');
  }, [user, router]);

  if (user) return null;
  return <LoginPage />;
}
