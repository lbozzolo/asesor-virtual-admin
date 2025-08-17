"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { firebaseApp } from "@/lib/firebase";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
});

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const auth = getAuth(firebaseApp);
  const functions = getFunctions(firebaseApp);
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const [devLink, setDevLink] = useState<string | null>(null);
  const [devKey, setDevKey] = useState<string>('');
  const [devResetPwd, setDevResetPwd] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
  if (isLocal) {
        // Intentar generar enlace sin correo
        const fn = httpsCallable(functions, 'devGeneratePasswordResetLink');
        const result: any = await fn({ email: values.email });
        setDevLink(result.data.link);
        toast({ title: "Enlace generado (local)", description: "Utiliza el enlace mostrado debajo." });
      } else {
        await sendPasswordResetEmail(auth, values.email);
        toast({
          title: "Correo enviado",
          description: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.",
        });
      }
    } catch (error) {
      console.error("Error al enviar correo de restablecimiento:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al intentar enviar el correo de restablecimiento.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
          <CardDescription>
            Introduce tu correo electrónico para recibir un enlace de restablecimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (isLocal ? 'Generando...' : 'Enviando...') : (isLocal ? 'Generar enlace local' : 'Enviar enlace')}
              </Button>
            </form>
          </Form>
          {isLocal && (
            <div className="mt-6 space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Reset directo (DEV) sin correo</p>
              <p className="text-xs text-muted-foreground">Usa esto si no puedes acceder al correo. Genera una nueva contraseña inmediatamente.</p>
              <div className="space-y-2">
                <label className="block text-xs font-medium">Clave de desarrollo (DEV_RESET_KEY)</label>
                <Input type="password" value={devKey} onChange={e => setDevKey(e.target.value)} placeholder="Ingresa la dev key" />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={loading || !form.getValues('email') || !devKey}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const callable = httpsCallable(functions, 'devSetUserPassword');
                    const result: any = await callable({ email: form.getValues('email'), devKey });
                    setDevResetPwd(result.data.password);
                    try { await navigator.clipboard.writeText(result.data.password); } catch {}
                    toast({ title: 'Contraseña regenerada', description: 'Copiada al portapapeles.' });
                  } catch (e) {
                    console.error(e);
                    toast({ variant: 'destructive', title: 'Error', description: 'No se pudo resetear la contraseña.' });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full"
              >Generar nueva contraseña directa</Button>
              {devResetPwd && (
                <div className="text-xs p-3 rounded-md bg-muted break-all">
                  <p className="font-medium mb-1">Nueva contraseña (solo dev):</p>
                  <code>{devResetPwd}</code>
                  <p className="mt-1 text-muted-foreground">Ya está copiada al portapapeles.</p>
                </div>
              )}
            </div>
          )}
          {devLink && (
            <div className="mt-4 p-3 border rounded-md bg-muted text-xs break-all">
              <p className="font-medium mb-1">Enlace de restablecimiento (solo desarrollo):</p>
              <a className="text-blue-600 underline" href={devLink}>{devLink}</a>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline">Volver a Iniciar Sesión</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
