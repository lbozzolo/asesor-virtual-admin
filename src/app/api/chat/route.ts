import { NextRequest, NextResponse } from 'next/server';
import { geminiModel } from '@/lib/firebase';
import type { Message } from '@/types';

// Helper function to format the history for the Gemini API
const buildHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));
};

export async function POST(req: NextRequest) {
  try {
    const { history, prompt, systemPrompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el "prompt" en la solicitud' }, { status: 400 });
    }

    // Use the pre-initialized model from firebase.ts
    // The system prompt is now part of the model initialization
    const chat = geminiModel.startChat({
      history: buildHistory(history || []),
      // Note: System prompt is often set at the model level, 
      // but if you need to override it per chat, you could adjust gemini.ts 
      // to create a new model instance here with the new systemPrompt.
      // For now, we assume a global system prompt.
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Error detallado en la API de chat:', error);
    
    // Return the actual error message from the Google API if available
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
