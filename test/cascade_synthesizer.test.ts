import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeAIIntervention } from '../lib/interventions/ai/synthesizer';

test('TC-CAS-01: Cascade failover on HTTP 404 (Model Not Found) succeeds on next model', async () => {
  const originalFetch = globalThis.fetch;
  const attemptedModels: string[] = [];

  globalThis.fetch = async (url: any, opts: any) => {
    const urlStr = String(url);
    const modelMatch = urlStr.match(/models\/([^:]+):/);
    const model = modelMatch ? modelMatch[1] : 'unknown';
    attemptedModels.push(model);

    if (model === 'gemini-3.8-flash') {
      // First model not found
      return new Response(JSON.stringify({ error: { message: 'models/gemini-3.8-flash is not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Second model succeeds
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: 'Gợi ý can thiệp thành công từ model fallback.' }],
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const res = await synthesizeAIIntervention({
      projectName: 'pyRevit Automation',
      slope: -0.22,
      recentAverageEnergy: 5,
      recentContextNotes: ['Đây là một ghi chú dài hơn 15 ký tự để kiểm tra cascade'],
      chosenCategory: 'break_task',
      userProvidedApiKey: 'AIzaSyValidTestKeyMock1234567890',
    });

    assert.equal(res, 'Gợi ý can thiệp thành công từ model fallback.');
    assert.ok(attemptedModels.length >= 2, 'Must have attempted at least 2 models in cascade');
    assert.equal(attemptedModels[0], 'gemini-3.8-flash');
    assert.equal(attemptedModels[1], 'gemini-3.7-flash');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-CAS-02: Cascade failover on HTTP 429 (Quota Exceeded) cascades to backup model', async () => {
  const originalFetch = globalThis.fetch;
  const attemptedModels: string[] = [];

  globalThis.fetch = async (url: any) => {
    const urlStr = String(url);
    const modelMatch = urlStr.match(/models\/([^:]+):/);
    const model = modelMatch ? modelMatch[1] : 'unknown';
    attemptedModels.push(model);

    if (attemptedModels.length === 1) {
      // First model rate limited
      return new Response(JSON.stringify({ error: { message: 'Resource has been exhausted (e.g. check quota)' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: 'Phục hồi thành công sau 429 quota overflow.' }],
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const res = await synthesizeAIIntervention({
      projectName: 'pyRevit Automation',
      slope: -0.22,
      recentAverageEnergy: 5,
      recentContextNotes: ['Đây là một ghi chú dài hơn 15 ký tự để kiểm tra cascade'],
      chosenCategory: 'break_task',
      userProvidedApiKey: 'AIzaSyValidTestKeyMock1234567890',
    });

    assert.equal(res, 'Phục hồi thành công sau 429 quota overflow.');
    assert.ok(attemptedModels.length >= 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-CAS-03: Total cascade failure returns null gracefully to trigger offline templates', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ error: { message: 'All models unavailable' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const res = await synthesizeAIIntervention({
      projectName: 'Offline Project',
      slope: -0.22,
      recentAverageEnergy: 5,
      recentContextNotes: ['Đây là một ghi chú dài hơn 15 ký tự để kiểm tra cascade'],
      chosenCategory: 'break_task',
      userProvidedApiKey: 'AIzaSyValidTestKeyMock1234567890',
    });

    assert.equal(res, null, 'Must return null to gracefully fall back to offline templates');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-CAS-04: Non-retryable error (HTTP 400 bad payload) aborts cascade immediately', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async () => {
    callCount++;
    return new Response(JSON.stringify({ error: { message: 'Invalid payload structure' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const res = await synthesizeAIIntervention({
      projectName: 'Bad Payload Project',
      slope: -0.22,
      recentAverageEnergy: 5,
      recentContextNotes: ['Đây là một ghi chú dài hơn 15 ký tự để kiểm tra cascade'],
      chosenCategory: 'break_task',
      userProvidedApiKey: 'AIzaSyValidTestKeyMock1234567890',
    });

    assert.equal(res, null);
    assert.equal(callCount, 1, 'Non-retryable 400 error must not hammer other models');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
