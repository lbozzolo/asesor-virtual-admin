import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

// Palabras clave para detectar solicitudes de listado
const LIST_KEYWORDS = [
  /\blista(d|t)o\b/i,
  /cat[aá]logo/i,
  /todos\s+los\s+cursos/i,
  /ver\s+cursos/i,
  /cu[aá]les\s+son\s+los\s+cursos/i,
  /qu[eé]\s+cursos\s+tienen/i,
  /dame\s+los\s+cursos/i,
  /mostrar\s+cursos/i,
];

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Falta el mensaje' });
  }

  // Leer cursos desde public/cursos.txt
  let cursosNombres: string[] = [];
  try {
    const filePath = path.join(process.cwd(), 'public', 'cursos.txt');
    const cursosTxt = await fs.readFile(filePath, 'utf-8');
    cursosNombres = cursosTxt.split('\n').map(c => c.trim()).filter(Boolean);
  } catch (error) {
    console.error('ERROR al leer public/cursos.txt:', error);
    return res.status(500).json({ error: 'No se pudo leer el archivo de cursos.' });
  }

  const nmsg = normalize(message);

  // 1) Si piden listado, devolver SIEMPRE la lista real
  if (LIST_KEYWORDS.some(r => r.test(message))) {
    return res.status(200).json({ response: `Estos son los cursos disponibles:\n- ${cursosNombres.join('\n- ')}` });
  }

  // 2) Buscar coincidencias seguras por palabras (>=4 letras) dentro de los nombres reales
  const userWords = nmsg.split(/\W+/).filter(w => w.length >= 4);
  const matches = cursosNombres.filter(curso => {
    const c = normalize(curso);
    return userWords.some(w => c.includes(w));
  });

  if (matches.length > 0) {
    // Si hay varias, listarlas; si hay una, afirmarla
    if (matches.length === 1) {
      return res.status(200).json({ response: `¡Sí! Tenemos el curso "${matches[0]}".` });
    }
    return res.status(200).json({ response: `Cursos relacionados disponibles:\n- ${matches.join('\n- ')}` });
  }

  // 3) Sin coincidencias
  return res.status(200).json({ response: 'No tenemos un curso relacionado con tu consulta.' });
}
