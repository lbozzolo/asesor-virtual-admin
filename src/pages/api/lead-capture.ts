import type { NextApiRequest, NextApiResponse } from 'next';
let admin: any;
let db: any;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
    });
  }
  db = admin.firestore();
} catch (e) {
  console.error('No se pudo inicializar firebase-admin', e);
}

/*
  Endpoint POST /api/lead-capture
  Body JSON: { conversationId, firstName, lastName, email, phone, consent }
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  try {
    const { conversationId, firstName, lastName, email, phone, consent } = req.body || {};
    if (!conversationId) return res.status(400).json({ error: 'conversationId requerido' });
    if (!firstName || !email || !phone) return res.status(400).json({ error: 'Nombre, email y teléfono son obligatorios' });

    // Validaciones simples
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido' });
    const phoneDigits = phone.replace(/\D/g,'');
    if (phoneDigits.length < 7) return res.status(400).json({ error: 'Teléfono demasiado corto' });

    const now = new Date().toISOString();
    const fullName = `${firstName} ${lastName||''}`.trim();

  if (!db) return res.status(500).json({ error: 'Admin SDK no inicializado en el servidor' });
  const ref = db.collection('conversations').doc(conversationId);
    await ref.set({
      customerData: {
        firstName,
        lastName: lastName||'',
        fullName,
        email,
        phone,
        consent: !!consent,
        source: 'chat-inline-form',
        collectedAt: now,
      },
      leadCapture: {
        requested: true,
        completed: true,
        completedAt: now,
        method: 'inline-form'
      },
      status: 'Potencial',
      updatedAt: new Date()
    }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (e:any) {
    console.error('Lead capture error', e);
    return res.status(500).json({ error: 'Error interno' });
  }
}
