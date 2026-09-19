import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeAIIntervention } from '../lib/interventions/ai/synthesizer';

test('TC-AI-01: synthesizeAIIntervention - Returns null immediately when no API key is set', async () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGoogleKey = process.env.GOOGLE_API_KEY;

  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;

  try {
    const res = await synthesizeAIIntervention({
      projectName: 'Test AI Project',
      slope: -0.22,
      recentAverageEnergy: 4,
      recentContextNotes: ['Đây là một ghi chú dài hơn 15 ký tự để kiểm tra AI'],
      chosenCategory: 'take_break',
    });

    assert.equal(res, null, 'Must return null when API key is not configured');
  } finally {
    if (originalGeminiKey) process.env.GEMINI_API_KEY = originalGeminiKey;
    if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
  }
});

test('TC-AI-02: synthesizeAIIntervention - Returns null when context notes are short (< 15 chars) or empty', async () => {
  // Even with a dummy API key, it should reject short notes (< 15 chars) before making network calls
  process.env.GEMINI_API_KEY = 'dummy-key';

  try {
    // Empty notes
    const resEmpty = await synthesizeAIIntervention({
      projectName: 'Test AI Project',
      slope: -0.22,
      recentAverageEnergy: 4,
      recentContextNotes: [],
      chosenCategory: 'take_break',
    });
    assert.equal(resEmpty, null, 'Must return null for empty context notes');

    // Short notes (< 15 chars)
    const resShort = await synthesizeAIIntervention({
      projectName: 'Test AI Project',
      slope: -0.22,
      recentAverageEnergy: 4,
      recentContextNotes: ['ok', 'hơi mệt', 'xong việc'],
      chosenCategory: 'take_break',
    });
    assert.equal(resShort, null, 'Must return null when notes are under 15 characters');
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});
