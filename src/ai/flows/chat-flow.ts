
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

export async function chat(messages: Message[]): Promise<string> {
  try {
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
        history: messages.slice(0, -1).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        })),
        safetySettings
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chatSession.sendMessage(lastMessage.text);
    
    const response = result.response;
    return response.text();
    
  } catch (error) {
    console.error("Error al obtener respuesta de la IA:", error);
    // Lanza un error más descriptivo para el frontend.
    throw new Error("No se pudo obtener una respuesta de la IA. Revisa la configuración y la clave de API.");
  }
}
