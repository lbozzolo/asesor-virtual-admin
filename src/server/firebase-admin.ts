// Admin SDK singleton limpio con soporte de archivo JSON o variables de entorno
import * as fs from 'fs';
import * as path from 'path';
let adminInstance: any = null;

export function getAdminDb() {
  if (!adminInstance) {
    const adminLib = require('firebase-admin');
    if (!adminLib.apps.length) {
      const saFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
      const saJsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; // JSON completo en una variable
      const saJsonB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64; // JSON completo Base64
      if (saFile) {
        const abs = path.isAbsolute(saFile) ? saFile : path.join(process.cwd(), saFile);
        const raw = fs.readFileSync(abs, 'utf-8');
        const json = JSON.parse(raw);
        if (json.private_key && json.private_key.includes('\\n')) json.private_key = json.private_key.replace(/\\n/g,'\n');
        if (process.env.NODE_ENV === 'development') {
          console.log('[AdminInit:file] usando', abs, 'pkLen', json.private_key?.length);
        }
        adminLib.initializeApp({ credential: adminLib.credential.cert(json) });
      } else if (saJsonInline) {
        let jsonStr = saJsonInline.trim();
        // Si viene con comillas extra las quitamos
        if ((jsonStr.startsWith('"') && jsonStr.endsWith('"')) || (jsonStr.startsWith("'") && jsonStr.endsWith("'"))) {
          jsonStr = jsonStr.slice(1,-1);
        }
        const json = JSON.parse(jsonStr);
        if (json.private_key && json.private_key.includes('\\n')) json.private_key = json.private_key.replace(/\\n/g,'\n');
        if (process.env.NODE_ENV === 'development') {
          console.log('[AdminInit:env-json] pkLen', json.private_key?.length);
        }
        adminLib.initializeApp({ credential: adminLib.credential.cert(json) });
      } else if (saJsonB64) {
        const decoded = Buffer.from(saJsonB64, 'base64').toString('utf8');
        const json = JSON.parse(decoded);
        if (json.private_key && json.private_key.includes('\\n')) json.private_key = json.private_key.replace(/\\n/g,'\n');
        if (process.env.NODE_ENV === 'development') {
          console.log('[AdminInit:env-b64] pkLen', json.private_key?.length);
        }
        adminLib.initializeApp({ credential: adminLib.credential.cert(json) });
      } else {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!projectId || !clientEmail || !privateKey) {
          throw new Error('Faltan credenciales Admin (definir FIREBASE_SERVICE_ACCOUNT_FILE o FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY)');
        }
        privateKey = privateKey.trim();
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
          privateKey = privateKey.slice(1,-1);
        }
        if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g,'\n');
        privateKey = privateKey.replace(/\r/g,'');
        if (!privateKey.endsWith('\n')) privateKey += '\n';
        if (!/^-----BEGIN PRIVATE KEY-----/.test(privateKey)) {
          throw new Error('Formato inesperado de PRIVATE KEY');
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('[AdminInit:env] projectId', projectId, 'clientEmail', clientEmail, 'pkLen', privateKey.length);
        }
        adminLib.initializeApp({ credential: adminLib.credential.cert({ projectId, clientEmail, privateKey }) });
      }
    }
    adminInstance = adminLib;
  }
  return adminInstance.firestore();
}

export function isAdminInitialized() {
  return !!adminInstance;
}
