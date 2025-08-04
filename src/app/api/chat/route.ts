
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { Message } from '@/types';

// Comprobar si la clave de API está configurada
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
  console.error("Falta la variable de entorno GEMINI_API_KEY o es un valor de ejemplo.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Usar el modelo optimizado para chat
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
});

const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

// Ayudante para formatear el historial para la API de Gemini
const buildHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));
};

export async function POST(req: NextRequest) {
  // Comprobación inicial de la clave de API
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
      return NextResponse.json({ error: 'La clave de API de Gemini no está configurada en el servidor. Por favor, añádela al archivo .env.' }, { status: 500 });
  }

  try {
    const { history, prompt, systemPrompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el "prompt" en la solicitud' }, { status: 400 });
    }

    const chat = model.startChat({
      history: buildHistory(history || []),
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
      safetySettings,
      systemInstruction: systemPrompt, 
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: unknown) {
    console.error('Error detallado en la API de chat:', error);
    
    let errorMessage = "Ocurrió un error interno en el servidor al contactar con Gemini.";
    let statusCode = 500;

    if (error instanceof Error) {
        // Devolver el mensaje de error real de la API de Google si está disponible
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
