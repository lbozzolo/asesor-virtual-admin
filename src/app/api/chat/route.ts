import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { Message } from '@/types';

// Ensure the GEMINI_API_KEY is available
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
  console.error("Missing or placeholder GEMINI_API_KEY environment variable");
  // Don't throw an error during build, but handle it in requests.
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
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

// Helper to format the history for the Gemini API
const buildHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));
};

export async function POST(req: NextRequest) {
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
      // The system instruction can be passed here if needed, though combining it with the user prompt is also effective.
      // systemInstruction: systemPrompt, 
    });

    // We combine the system prompt with the user's first message for context.
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    const result = await chat.sendMessage(fullPrompt);

    const response = result.response;
    const text = response.text();

    if (text) {
      return NextResponse.json({ text });
    } else {
      console.warn("La API de Gemini finalizó la llamada pero no devolvió respuesta.", result);
      if (response?.promptFeedback?.blockReason) {
         return NextResponse.json({ text: `Lo siento, no puedo responder a eso. Razón: ${response.promptFeedback.blockReason}` });
      }
      return NextResponse.json({ error: 'Lo siento, no he podido generar una respuesta. La API no devolvió contenido.' }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Error en la API de chat:', error);
    
    let errorMessage = "Ocurrió un error interno en el servidor.";
    let statusCode = 500;

    if (error instanceof Error) {
        // Check for specific error messages from Google's API client
        if (error.message.includes('API key not valid')) {
            errorMessage = "La clave de API de Gemini no es válida. Por favor, verifica que la hayas copiado correctamente en el archivo .env.";
            statusCode = 401; // Unauthorized
        } else if (error.message.includes('permission denied')) {
            errorMessage = "Permiso denegado. Esto puede deberse a que tu clave de API tiene restricciones de URL o IP. Intenta usar una clave sin restricciones.";
            statusCode = 403; // Forbidden
        }
    }
    
    return NextResponse.json({ error: 'Error al contactar la API de Gemini.', details: errorMessage }, { status: statusCode });
  }
}
