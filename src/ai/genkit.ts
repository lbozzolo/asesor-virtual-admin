import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase/plugin';
import { next } from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
    next({
      // The Next.js plugin is required to use Genkit in a Next.js app.
    }),
  ],
  enableTracingAndMetrics: true,
});
