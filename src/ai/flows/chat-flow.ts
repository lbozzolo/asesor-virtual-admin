
'use server';
/**
 * @fileOverview Flow for handling chat interactions.
 *
 * - chat - A function that handles the chat process.
 * - ChatInputSchema - The input type for the chat function.
 * - ChatResponseSchema - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Message } from '@/types';

export const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
      text: z.string(),
    })),
  })),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatResponseSchema = z.object({
  text: z.string(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

async function getPrompt(): Promise<string> {
  const promptPath = path.join(process.cwd(), 'public', 'prompts', 'v1_base.txt');
  try {
    return await fs.readFile(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error reading prompt file:', error);
    return 'You are a helpful assistant.';
  }
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: ChatInputSchema,
  prompt: `{{#each history}}{{#each content}}{{role}}: {{text}}\n{{/each}}{{/each}}user: {{message}}\nmodel:\n`,
});


const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatResponseSchema,
  },
  async (input) => {
    const systemPrompt = await getPrompt();

    const response = await ai.generate({
      prompt: input.message,
      model: 'googleai/gemini-1.5-flash-latest',
      history: input.history.map(msg => ({
        role: msg.role,
        content: msg.content.map(c => c.text).join(' '),
      })).map(m => ({
          role: m.role,
          content: [{text: m.content}]
      })),
      config: {
        temperature: 0.7,
      },
      system: systemPrompt
    });

    return { text: response.text() };
  }
);


export async function chat(messages: Message[], newMessage: string): Promise<ChatResponse> {
    const genkitHistory = messages.map(m => ({
        role: m.role,
        content: [{ text: m.text }]
    }));

    return await chatFlow({
        history: genkitHistory,
        message: newMessage
    });
}
