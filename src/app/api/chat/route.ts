
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message } from '@/types';

// Helper function to format the history for the Gemini API
const buildHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));
};

export async function POST(req: NextRequest) {
  // 1. Check if the API key is present and valid
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      const errorMsg = 'La clave de API de Gemini no está configurada en el servidor. Por favor, añádela al archivo .env.';
      console.error(`Error en /api/chat: ${errorMsg}`);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
  }

  try {
    const { history, prompt, systemPrompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el "prompt" en la solicitud' }, { status: 400 });
    }

    // 2. Initialize the API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: systemPrompt,
    });
    
    // 3. Start the chat
    const chat = model.startChat({
      history: buildHistory(history || []),
      // Temporarily removing safety and generation configs to simplify
    });

    // 4. Send the message
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: unknown) {
    // 5. Catch and log any errors, returning a more specific message
    console.error('Error detallado en la API de chat:', error);
    
    let errorMessage = "Ocurrió un error desconocido en el servidor al contactar con Gemini.";
    
    // Return the actual error message from the Google API if available
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
