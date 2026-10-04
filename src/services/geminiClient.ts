/**
 * Server-side Gemini AI Client with Resilient Search Grounding & Adaptive Fallback
 * Conforms strictly to gemini-api skill instructions:
 * - SDK: @google/genai
 * - User-Agent: aistudio-build
 * - Model: gemini-3.8-flash
 * - Server-only execution
 * - Handles 429 Search Grounding quota limits gracefully with traceable source attribution
 */

import { GoogleGenAI } from '@google/genai';

let geminiInstance: GoogleGenAI | null = null;
let lastKnownQuotaIssue: string | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    geminiInstance = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiInstance;
}

export const PRIMARY_MODEL = 'gemini-flash-latest';

export function getLastKnownQuotaIssue(): string | null {
  return lastKnownQuotaIssue;
}

export interface GroundedCallResult {
  text: string;
  sources: string[];
  usedLiveGrounding: boolean;
  quotaRestricted: boolean;
}

/**
 * Resilient call to Gemini 3.8 Flash.
 * Attempts live Google Search grounding first.
 * If Search Grounding returns 429/RESOURCE_EXHAUSTED due to plan quotas,
 * gracefully falls back to direct model knowledge with explicit attribution.
 */
export async function callGroundedGemini(
  prompt: string,
  options: {
    temperature?: number;
    maxRetries?: number;
  } = {}
): Promise<GroundedCallResult> {
  const ai = getGeminiClient();
  const temperature = options.temperature ?? 0.2;
  const maxRetries = options.maxRetries ?? 2;

  // 1. Try with Google Search Grounding tool
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature,
        },
      });

      const text = response.text || '';
      const sources: string[] = [];
      const candidateObj = response.candidates?.[0];
      const grounding = candidateObj?.groundingMetadata as any;
      if (grounding?.groundingChunks) {
        for (const chunk of grounding.groundingChunks) {
          if (chunk.web?.uri) {
            sources.push(chunk.web.uri);
          }
        }
      }

      lastKnownQuotaIssue = null;
      return {
        text,
        sources,
        usedLiveGrounding: true,
        quotaRestricted: false,
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuota =
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED');

      if (isQuota) {
        lastKnownQuotaIssue = 'Google Search Grounding quota exhausted (429). Strict Safe Mode active: ungrounded factual research is strictly prohibited.';
        console.warn('[GeminiClient] Search Grounding quota reached (429). Returning safe failure without ungrounded fallback.');
        return {
          text: '',
          sources: [],
          usedLiveGrounding: false,
          quotaRestricted: true,
        };
      }

      if (attempt < maxRetries) {
        // Exponential backoff for transient errors
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      } else {
        console.warn(`[GeminiClient] Grounding error on attempt ${attempt}:`, errMsg);
        break;
      }
    }
  }

  // Strict Policy: Never use ungrounded Gemini knowledge for factual business research.
  // When live search grounding fails or is quota-blocked, return safe failure with zero fabricated content.
  return {
    text: '',
    sources: [],
    usedLiveGrounding: false,
    quotaRestricted: true,
  };
}
