import { NextRequest, NextResponse } from 'next/server';
import { geminiModel } from '@/lib/firebase';
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
    const { history, prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el "prompt" en la solicitud' }, { status: 400 });
    }
    
    // Start a chat session with the model, including the cleaned history
    const chat = geminiModel.startChat({
      history: buildHistory(history || []),
    });

    // Send the user's prompt to the model
    const result = await chat.sendMessage(prompt);
    
    // Get the model's response
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Error detallado en la API de chat:', error);
    
    // Return a more detailed error message
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
