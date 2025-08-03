import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { Message } from '@/types';

// IMPORTANT: Set the GEMINI_API_KEY environment variable in your deployment environment.
// This is how the server will authenticate with the Google AI API.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
    
    if (result.response) {
      const text = result.response.text();
      return NextResponse.json({ text });
    } else {
      console.warn("Gemini API call finished but no response was returned.", result);
      // Check if the response was blocked
      if (result.response.promptFeedback?.blockReason) {
         return NextResponse.json({ text: `Lo siento, no puedo responder a eso. Razón: ${result.response.promptFeedback.blockReason}` });
      }
      return NextResponse.json({ text: 'Lo siento, no he podido generar una respuesta. Por favor, inténtalo de nuevo.' });
    }

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
