"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { firebaseApp } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/types";

interface UserFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
}

const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[a-z]/, "Debe contener al menos una minúscula.")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula.")
  .regex(/[0-9]/, "Debe contener al menos un número.");

const baseSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido." }),
  role: z.enum(["admin", "operador", "superadmin"]),
});

const createUserSchema = baseSchema.extend({
    password: passwordSchema,
});

const editUserSchema = baseSchema;


export function UserFormSheet({ isOpen, onClose, user }: UserFormSheetProps) {
  const { appUser: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const functions = getFunctions(firebaseApp);
  const isEditMode = !!user;

  const form = useForm({
    resolver: zodResolver(isEditMode ? editUserSchema : createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "operador" as UserRole,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (user) {
          form.reset({
            email: user.email ?? '',
            role: user.role,
          });
        } else {
          form.reset({
            email: "",
            password: "",
            role: "operador",
          });
        }
    }
  }, [user, form, isOpen]);


  const onSubmit = async (values: z.infer<typeof baseSchema> | z.infer<typeof createUserSchema>) => {
    setLoading(true);

    try {
        if (isEditMode && user) {
            if (user.role !== values.role) {
                const updateUserRole = httpsCallable(functions, 'updateUserRole');
                await updateUserRole({ uid: user.uid, role: values.role });
                toast({ title: "Éxito", description: "El rol del usuario ha sido actualizado." });
            } else {
                 toast({ title: "Sin cambios", description: "No se ha modificado el rol del usuario." });
            }
        } else {
            const createUserAccount = httpsCallable(functions, 'createUser');
            await createUserAccount(values);
            toast({ title: "Éxito", description: "El usuario ha sido creado correctamente." });
        }
        onClose();
    } catch (error: any) {
        console.error("Error al guardar usuario:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Ocurrió un error al guardar el usuario.",
        });
    } finally {
        setLoading(false);
    }
  };

  const roleOptions: UserRole[] = currentUser?.role === 'superadmin' 
    ? ["superadmin", "admin", "operador"] 
    : ["admin", "operador"];
  
  const canEditRole = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'admin' && user?.role === 'operador') return true;
    if (currentUser.role === 'admin' && !isEditMode) return true; // Can create operators
    return false;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Editar Usuario" : "Añadir Nuevo Usuario"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Modifica los detalles del usuario." : "Completa el formulario para añadir un nuevo usuario."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@ejemplo.com" {...field} disabled={isEditMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditMode && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                     <p className="text-sm text-muted-foreground">
                        Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEditRole()}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {roleOptions.map(role => (
                            <SelectItem 
                                key={role} 
                                value={role} 
                                className="capitalize"
                                disabled={currentUser?.role === 'admin' && (role === 'admin' || role === 'superadmin')}>
                            {role}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={loading}>
                    {loading ? (isEditMode ? "Guardando..." : "Creando...") : (isEditMode ? "Guardar Cambios" : "Crear Usuario")}
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
