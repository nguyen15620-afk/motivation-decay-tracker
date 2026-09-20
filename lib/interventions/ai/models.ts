/**
 * Motivation Decay Tracker - Gemini Model Registry & Cascade Priority Chain
 * 
 * Defines the priority cascade of Google Gemini models.
 * If a model returns 404 (Not Found / Unsupported) or 429 (Quota Exceeded / Rate Limited),
 * the engine automatically fails over to the next candidate model in the chain.
 */

export const GEMINI_MODEL_CASCADE: readonly string[] = [
  // Tier 1: Flagship Flash (Highest empathy and reasoning quality)
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3-flash',

  // Tier 2: High-Quota Flash Lite (Huge 500 RPD / 15 RPM quota reserves)
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',

  // Tier 3: Base Flash models
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/**
 * Strips the 'models/' prefix from a Google model name string if present.
 */
export function cleanModelName(modelName: string): string {
  if (!modelName) return '';
  return modelName.replace(/^models\//, '');
}

/**
 * Given a list of model names returned by Google ListModels, selects the highest-priority
 * candidate matching GEMINI_MODEL_CASCADE, or intelligently picks the best available Flash model.
 */
export function selectOptimalModel(availableModels: string[]): string {
  if (!availableModels || availableModels.length === 0) {
    return GEMINI_MODEL_CASCADE[0]; // Default to top tier
  }

  const normalizedAvailable = new Set(availableModels.map(cleanModelName));

  // 1. Check priority cascade in order
  for (const candidate of GEMINI_MODEL_CASCADE) {
    if (normalizedAvailable.has(candidate)) {
      return candidate;
    }
  }

  // 2. If no exact cascade match, look for any Flash model available
  for (const m of normalizedAvailable) {
    if (m.includes('flash')) {
      return m;
    }
  }

  // 3. Fallback to first available or standard
  return cleanModelName(availableModels[0]) || 'gemini-2.5-flash';
}

/**
 * Checks whether an HTTP response status or error message warrants
 * cascading to the next model in the chain (e.g. 404 Model Not Found or 429 Quota Exceeded).
 */
export function isRetryableModelError(status: number, errorMessage?: string): boolean {
  // 404: Model does not exist for this API version or account
  if (status === 404) return true;

  // 429: Rate limit or quota exhausted
  if (status === 429) return true;

  // 503: Service temporarily unavailable
  if (status === 503) return true;

  // Specific error messages
  if (errorMessage) {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('not found') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource exhausted')) {
      return true;
    }
  }

  return false;
}
