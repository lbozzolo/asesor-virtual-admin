
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message } from '@/types';

// Ayudante para formatear el historial para la API de Gemini
const buildHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));
};

export async function POST(req: NextRequest) {
  // 1. Verificar si la clave de API está presente
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

    // 2. Inicializar el cliente de la API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: systemPrompt,
    });
    
    // 3. Iniciar el chat
    const chat = model.startChat({
      history: buildHistory(history || []),
      // Se eliminan temporalmente las configuraciones de seguridad y generación para simplificar
    });

    // 4. Enviar el mensaje
    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: unknown) {
    // 5. Capturar y registrar cualquier error
    console.error('Error detallado en la API de chat:', error);
    
    let errorMessage = "Ocurrió un error desconocido en el servidor al contactar con Gemini.";
    
    // Devolver el mensaje de error real de la API de Google si está disponible
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
