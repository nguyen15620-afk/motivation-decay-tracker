'use client';

/**
 * Hook: useUserApiKey.ts
 * Description: Manages user-provided Google Gemini API key in browser localStorage.
 * Adheres strictly to Zero Server Persistence: Keys are stored exclusively
 * on the client-side and transmitted only as ephemeral headers during check-in.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'motivation_tracker_gemini_api_key';

export function useUserApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        setApiKey(stored.trim());
      }
    } catch {
      // Ignore localStorage access issues in restricted modes
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveApiKey = (newKey: string) => {
    const cleaned = newKey.trim();
    if (cleaned) {
      localStorage.setItem(STORAGE_KEY, cleaned);
      setApiKey(cleaned);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
  };

  const getMaskedKey = (): string => {
    if (!apiKey) return '';
    if (apiKey.length <= 8) return '••••••••';
    const start = apiKey.slice(0, 6);
    const end = apiKey.slice(-4);
    return `${start}••••••••••••••••${end}`;
  };

  return {
    apiKey,
    isLoaded,
    hasCustomKey: Boolean(apiKey && apiKey.length > 10),
    maskedKey: getMaskedKey(),
    saveApiKey,
    clearApiKey,
  };
}
