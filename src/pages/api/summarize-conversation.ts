import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { messages } = req.body as { messages?: { role: string; text: string }[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Faltan mensajes para resumir.' });
  }

  const joined = messages.map(m => `${m.role === 'user' ? 'Cliente' : 'Asesor'}: ${m.text}`.trim()).join('\n');
  const truncated = joined.slice(0, 8000);

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta GEMINI_API_KEY' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Resume la siguiente conversación entre un cliente y un asesor. Devuelve:\n1. Contexto breve (1 línea)\n2. Necesidad principal del cliente\n3. Cursos (solo si fueron mencionados literalmente, no inventes ninguno). Si no se mencionan, indica "Sin cursos mencionados".\n4. Estado actual / siguiente acción recomendada\n\nFormato:\nContexto: ...\nNecesidad: ...\nCursos: ...\nAcción: ...\n\nConversación:\n${truncated}`;
    const result = await model.generateContent(prompt);
    const out = result.response.text();
    return res.status(200).json({ summary: out });
  } catch (e: any) {
    console.error('Error al resumir conversación', e);
    return res.status(500).json({ error: 'No se pudo generar el resumen.' });
  }
}
