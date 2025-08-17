/**
 * Script CLI para resetear (o asignar) la contraseña de un usuario usando Firebase Admin.
 * Uso:
 *   npm run dev:reset-pass -- <email> [NuevaContraseña]
 * Ejemplo:
 *   npm run dev:reset-pass -- admin@ejemplo.com MiPassSegura123!
 *
 * Requiere credenciales de servicio. Opciones de carga:
 * 1) Archivo JSON (service account) fuera del repo y variable SERVICE_ACCOUNT_FILE apuntando al archivo.
 * 2) Archivo local serviceAccount.json (IGNORAR en .gitignore) en la raíz del proyecto.
 * 3) Variables de entorno FIREBASE_SA_PROJECT_ID, FIREBASE_SA_CLIENT_EMAIL, FIREBASE_SA_PRIVATE_KEY.
 *
 * Nunca subas el JSON al repositorio.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceAccountShape {
  project_id: string;
  client_email: string;
  private_key: string;
  [k: string]: any;
}

function loadServiceAccount(): ServiceAccountShape | undefined {
  const file = process.env.SERVICE_ACCOUNT_FILE;
  if (file && fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const localPath = path.join(process.cwd(), 'serviceAccount.json');
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  }
  const projectId = process.env.FIREBASE_SA_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_SA_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }
  return undefined;
}

async function main() {
  const [, , emailArg, passArg] = process.argv;
  if (!emailArg) {
    console.error('Uso: npm run dev:reset-pass -- <email> [NuevaContraseña]');
    process.exit(1);
  }
  const newPassword = passArg || generatePassword();

  const sa = loadServiceAccount();
  if (!sa) {
    console.error('No se pudo cargar Service Account. Configura SERVICE_ACCOUNT_FILE o variables FIREBASE_SA_*');
    process.exit(1);
  }

  initializeApp({ credential: cert(sa) });

  try {
    const auth = getAuth();
    const userRecord = await auth.getUserByEmail(emailArg);
    await auth.updateUser(userRecord.uid, { password: newPassword });
    console.log(`Contraseña actualizada para ${emailArg}. Nueva contraseña: ${newPassword}`);
  } catch (e: any) {
    if (e?.code === 'auth/user-not-found') {
      console.error('Usuario no encontrado.');
    } else {
      console.error('Error actualizando contraseña:', e);
    }
    process.exit(2);
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*?';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

main();
