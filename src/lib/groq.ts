import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';

export const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // For demo purposes, in production this should be on the server
});
