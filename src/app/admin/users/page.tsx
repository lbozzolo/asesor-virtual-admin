"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProtectedLayout } from "@/components/protected-layout";
import { UsersTable } from "@/components/users-table";
import { UserFormSheet } from "@/components/user-form-sheet";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const usersCollectionRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as AppUser));
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsSheetOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };
  
  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedUser(null);
  };

  return (
    <ProtectedLayout allowedRoles={["admin", "superadmin"]}>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Crea, edita y gestiona los usuarios del sistema.</CardDescription>
            </div>
            <Button onClick={handleAddUser}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Usuario
            </Button>
          </CardHeader>
          <CardContent>
            <UsersTable users={users} onEditUser={handleEditUser} loading={loading}/>
          </CardContent>
        </Card>
      </main>
      <UserFormSheet 
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        user={selectedUser}
      />
    </ProtectedLayout>
  );
}
