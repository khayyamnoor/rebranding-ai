import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (client) return client;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  client = new GoogleGenAI({});
  return client;
}
