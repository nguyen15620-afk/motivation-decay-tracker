/**
 * Motivation Decay Tracker - AI Empathy Synthesizer
 * 
 * Invokes Google Gemini API to craft bespoke, contextual coaching messages
 * using a Cascade Fallback chain (Gemini 3.8 -> 3.5 Lite -> 2.5 Flash...).
 * Automatically falls over to subsequent models on 404 (Not Found) or 429 (Quota Exceeded).
 * Falls back gracefully to null on total failure or timeout, triggering the offline CBT templates.
 */

import { AIPromptContext, buildAIEmpathyPrompt } from './prompt';
import { GEMINI_MODEL_CASCADE, isRetryableModelError } from './models';

export interface SynthesizeAIInterventionParams extends AIPromptContext {
  userProvidedApiKey?: string | null;
}

export async function synthesizeAIIntervention(
  context: SynthesizeAIInterventionParams
): Promise<string | null> {
  // BYOK Resolution: User-provided key takes precedence over server environment keys
  const apiKey = context.userProvidedApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }

  // Only synthesize with AI if there is a rich context note (> 15 chars) to personalize from
  const hasRichContext = context.recentContextNotes.some(
    (note) => note && note.trim().length >= 15
  );

  if (!hasRichContext) {
    return null;
  }

  const prompt = buildAIEmpathyPrompt(context);
  const deadline = Date.now() + 3500; // 3.5s total budget across cascade attempts

  for (const model of GEMINI_MODEL_CASCADE) {
    const remainingTime = deadline - Date.now();
    if (remainingTime < 500) {
      // Not enough time left for another network hop
      break;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.min(2500, remainingTime));

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 150,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && typeof candidateText === 'string') {
          return candidateText.trim();
        }
      }

      // Check if this error warrants cascading to the next model
      if (isRetryableModelError(response.status)) {
        console.warn(`[AI Synthesizer] Model "${model}" returned ${response.status}. Cascading to next model...`);
        continue;
      }

      // Non-retryable error (e.g. invalid API key 400)
      console.warn(`[AI Synthesizer] Non-retryable error ${response.status} on model "${model}". Falling back.`);
      break;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // On network timeout or abort, try next model if time allows
      continue;
    }
  }

  // If all models failed or timed out, gracefully return null to trigger offline CBT templates
  return null;
}
