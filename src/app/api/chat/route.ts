import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { Message } from '@/types';

// Ensure the GEMINI_API_KEY is available
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

function buildFullPrompt(systemPrompt: string, history: Message[], prompt: string) {
  let fullPrompt = `${systemPrompt}\n\n`;
  history.forEach(message => {
    if (message.role === 'user') {
      fullPrompt += `User: ${message.text}\n`;
    } else {
      fullPrompt += `AI: ${message.text}\n`;
    }
  });
  fullPrompt += `User: ${prompt}\nAI:`;
  return fullPrompt;
}


export async function POST(req: NextRequest) {
  try {
    const { history, prompt, systemPrompt } = await req.json();

    if (!prompt || !systemPrompt) {
      return NextResponse.json({ error: 'Missing prompt or systemPrompt in the request body' }, { status: 400 });
    }

    const fullPrompt = buildFullPrompt(systemPrompt, history || [], prompt);

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings,
    });
    
    // Using optional chaining and nullish coalescing for safer access
    const response = result?.response;
    const text = response?.text();

    if (text) {
      return NextResponse.json({ text });
    } else {
      console.warn("Gemini API call finished but no response was returned.", result);
      // Check if the response was blocked
      if (response?.promptFeedback?.blockReason) {
         return NextResponse.json({ text: `Lo siento, no puedo responder a eso. Razón: ${response.promptFeedback.blockReason}` }, { status: 400 });
      }
      return NextResponse.json({ error: 'Lo siento, no he podido generar una respuesta. Por favor, inténtalo de nuevo.' }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
