
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message } from '@/types';

// Helper function to format the history for the Gemini API
const buildHistory = (history: Message[]) => {
  // The Gemini API requires the history to start with a 'user' role.
  // If the first message in our history is from the 'model', we need to filter it out.
  const startIndex = history.length > 0 && history[0].role === 'model' ? 1 : 0;

  return history.slice(startIndex).map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));
};

export async function POST(req: NextRequest) {
  try {
    const { history, prompt, systemPrompt } = await req.json();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
        return NextResponse.json({ 
            error: 'La clave de API de Gemini no está configurada en el servidor.',
            details: 'Por favor, añade tu clave de API al archivo .env en la raíz del proyecto.'
        }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el "prompt" en la solicitud' }, { status: 400 });
    }
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: systemPrompt || 'Eres un asesor comercial experto para Studyx. Tu objetivo es ayudar a los usuarios, responder sus preguntas y guiarlos para que se inscriban. Responde siempre en español, de forma amable y profesional.',
    });
    
    const chat = geminiModel.startChat({
      history: buildHistory(history || []),
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Error detallado en la API de chat:', error);
    
    const errorMessage = error.response?.data?.error?.message || error.message || "Ocurrió un error desconocido en el servidor al contactar con Gemini.";
    
    return NextResponse.json(
        { 
            error: "Error al comunicarse con la API de Gemini.",
            details: errorMessage 
        }, 
        { status: 500 }
    );
  }
}
