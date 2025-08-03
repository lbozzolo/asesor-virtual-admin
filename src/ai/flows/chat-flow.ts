'use server';
/**
 * @fileOverview A chat flow for the customer-facing chatbot.
 *
 * - chat - A function that handles the chat conversation with the AI.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Message } from '@/types';

const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).describe("The history of the conversation."),
  prompt: z.string().describe("The user's latest message."),
  systemPrompt: z.string().describe("The system prompt that guides the AI's behavior."),
  availableCourses: z.array(z.string()).describe("A list of available courses to inform the AI."),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput): Promise<string> {
    const isCourseQuery = input.availableCourses.some(course => 
      input.prompt.toLowerCase().includes(course.toLowerCase())
    );
    const coursesList = input.availableCourses.length > 0 
        ? `Aquí tienes la lista actualizada de cursos disponibles en Studyx: ${input.availableCourses.join(', ')}.` 
        : 'Actualmente no hay cursos disponibles.';
    
    const fullPrompt = `${isCourseQuery ? coursesList : ''}\n\n${input.prompt}`.trim();

    return chatFlow({ ...input, prompt: fullPrompt });
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatInputSchema },
  output: { format: 'text' },
  prompt: `{{systemPrompt}}

{{#each history}}
{{#if (eq role 'user')}}
User: {{{text}}}
{{else}}
AI: {{{text}}}
{{/if}}
{{/each}}

User: {{{prompt}}}
AI:
`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { history, prompt, systemPrompt } = input;

    const llmResponse = await chatPrompt({
        history,
        prompt,
        systemPrompt,
        availableCourses: input.availableCourses,
    });
    
    return llmResponse.text;
  }
);
