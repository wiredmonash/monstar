import type { GoogleGenAI } from '@google/genai';

let geminiClientPromise: Promise<GoogleGenAI | null> | null = null;

/**
 * Lazily import and construct the Google GenAI client. Returns null when no API
 * key is configured (so callers can skip Gemini-backed features gracefully).
 * The underlying dependency is only imported when a key is present.
 */
export function getGeminiClient(): Promise<GoogleGenAI | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      '[Gemini] GEMINI_API_KEY missing. Skipping overview generation.'
    );
    return Promise.resolve(null);
  }

  if (!geminiClientPromise) {
    geminiClientPromise = import('@google/genai')
      .then(
        ({ GoogleGenAI }) =>
          new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      )
      .catch((error) => {
        console.error('[Gemini] Failed to initialise Gemini client:', error);
        return null;
      });
  }

  return geminiClientPromise;
}
