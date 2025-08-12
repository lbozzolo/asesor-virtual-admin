
'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Message } from '@/types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("La variable de entorno GEMINI_API_KEY no está definida.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

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
    const promptPath = path.join(process.cwd(), 'public', 'prompts', 'v1_base.txt');
    const systemPrompt = await fs.readFile(promptPath, 'utf-8');

    const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
    }));

    // The last message is the new prompt
    const lastMessage = history.pop();
    if (!lastMessage) {
        throw new Error("No hay mensajes para enviar.");
    }

    const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        history,
        systemInstruction: systemPrompt,
    });
    
    const result = await chatSession.sendMessage(lastMessage.parts);
    return result.response.text();
  } catch (error) {
    console.error("Error al chatear con Gemini:", error);
    // Consider providing a more user-friendly error message
    throw new Error("No se pudo obtener una respuesta de la IA. Revisa la configuración y la clave de API.");
  }
}
