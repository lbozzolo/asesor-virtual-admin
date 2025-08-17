
'use server';
/**
 * @fileOverview Un flujo de chat que se conecta directamente a la API de Gemini.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Message } from '@/types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Asegúrate de que la clave de API esté disponible como una variable de entorno.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Keyword local configurable
const LEAD_CAPTURE_KEYWORD = process.env.NEXT_PUBLIC_LEAD_CAPTURE_KEYWORD || '!capturar';

// (Eliminado uso de firebase-admin aquí para evitar errores en runtime Edge.)

async function maybeTriggerLeadCapture(allMessages: Message[]): Promise<{ triggered: boolean; reply?: string; }> {
  const last = allMessages[allMessages.length - 1];
  if (!last || last.role !== 'user') return { triggered: false };
  const text = last.text.trim().toLowerCase();
  // Disparo explícito por keyword
  if (text === LEAD_CAPTURE_KEYWORD.toLowerCase()) {
    return { triggered: true, reply: 'Perfecto, para poder continuar necesito algunos datos para contactarte. Completa el formulario que aparece debajo (nombre, email y teléfono). Luego te confirmo y seguimos.' };
  }
  // Heurística simple: si ya hubo al menos 4 mensajes del usuario y menciona palabras de intención
  const userCount = allMessages.filter(m => m.role === 'user').length;
  if (userCount >= 4) {
    const intentWords = ['inscrib', 'precio', 'cost', 'costo', 'matricul', 'quiero empezar', 'empezar'];
    if (intentWords.some(w => text.includes(w))) {
      return { triggered: true, reply: 'Genial, antes de darte más detalles necesito tus datos de contacto (nombre, email y teléfono). Completa el formulario que ves ahora y seguimos enseguida.' };
    }
  }
  return { triggered: false };
}

export async function chat(messages: Message[]): Promise<string> {
  try {
    // Siempre ejecuta en servidor (este módulo es 'use server').
    // 1) Resolver determinísticamente preguntas sobre cursos usando public/cursos.txt
    const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
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

    const userMessages = [...messages];
    while (userMessages.length && userMessages[0].role !== 'user') {
      userMessages.shift();
    }
    const lastMessage = userMessages[userMessages.length - 1];
    const userText = lastMessage?.text ?? '';

    // Leer cursos
    let cursosNombres: string[] = [];
    try {
      const systemPromptPath = path.join(process.cwd(), 'public', 'cursos.txt');
      const cursosTxt = await fs.readFile(systemPromptPath, 'utf-8');
      cursosNombres = cursosTxt.split('\n').map(c => c.trim()).filter(Boolean);
    } catch (e) {
      // Si falla la lectura, seguir a Gemini pero sin inventar listado
      cursosNombres = [];
    }

    // Listado explícito
    if (LIST_KEYWORDS.some(r => r.test(userText))) {
      if (cursosNombres.length > 0) {
        return `Estos son los cursos disponibles:\n- ${cursosNombres.join('\n- ')}`;
      }
      return 'No se pudo acceder al listado en este momento.';
    }

    // Coincidencias con palabras (>=4 letras)
    const nmsg = normalize(userText);
    const userWords = nmsg.split(/\W+/).filter(w => w.length >= 4);
    if (cursosNombres.length > 0 && userWords.length > 0) {
      const matches = cursosNombres.filter(curso => {
        const c = normalize(curso);
        return userWords.some(w => c.includes(w));
      });
      if (matches.length === 1) {
        return `¡Sí! Tenemos el curso "${matches[0]}".`;
      } else if (matches.length > 1) {
        return `Cursos relacionados disponibles:\n- ${matches.join('\n- ')}`;
      }
    }

    // 2) Revisión de posible disparo de captura de datos (no interfiere con curso)
    const leadTrigger = await maybeTriggerLeadCapture(userMessages);
    if (leadTrigger.triggered) {
      return leadTrigger.reply || 'Por favor completa el formulario de datos para continuar.';
    }

    // 3) No parece una consulta de cursos ni disparo de captura: usar Gemini para el resto
    // Si estamos en el servidor, usar el SDK
    // console.log('DEBUG GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'PRESENTE' : 'NO DEFINIDA');
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("La clave de API de Gemini no está configurada en las variables de entorno.");
    }
    const systemPromptPath = path.join(process.cwd(), 'public', 'prompts', 'v1_base.txt');
    const systemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      systemInstruction: systemPrompt,
    });
    const chatSession = model.startChat({
      history: userMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
      safetySettings
    });
    const result = await chatSession.sendMessage(userText);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error al obtener respuesta de la IA:", error);
    throw new Error("No se pudo obtener una respuesta de la IA. Revisa la configuración y la clave de API.");
  }
}
