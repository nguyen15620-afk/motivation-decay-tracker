import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as testKeyHandler } from '../app/api/ai/test-key/route';
import {
  cleanModelName,
  selectOptimalModel,
  isRetryableModelError,
  GEMINI_MODEL_CASCADE,
} from '../lib/interventions/ai/models';

/* =========================================================================
 * UNIT TESTS: Model Registry & Cascade Selection (models.ts)
 * ========================================================================= */

test('TC-MOD-01: cleanModelName properly strips "models/" prefix or returns clean name', () => {
  assert.equal(cleanModelName('models/gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.equal(cleanModelName('models/gemini-3.5-flash-lite'), 'gemini-3.5-flash-lite');
  assert.equal(cleanModelName('gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.equal(cleanModelName(''), '');
  assert.equal(cleanModelName(null as any), '');
  assert.equal(cleanModelName(undefined as any), '');
});

test('TC-MOD-02: selectOptimalModel defaults to top tier when model list is empty or null', () => {
  assert.equal(selectOptimalModel([]), GEMINI_MODEL_CASCADE[0]);
  assert.equal(selectOptimalModel(null as any), GEMINI_MODEL_CASCADE[0]);
  assert.equal(selectOptimalModel(undefined as any), GEMINI_MODEL_CASCADE[0]);
});

test('TC-MOD-03: selectOptimalModel picks highest priority model matching cascade order', () => {
  const models = [
    'models/gemini-2.0-flash', // Tier 3
    'models/gemini-3.5-flash-lite', // Tier 2
    'models/text-embedding-004',
  ];
  // 3.5-flash-lite is higher in cascade than 2.0-flash
  assert.equal(selectOptimalModel(models), 'gemini-3.5-flash-lite');

  const modelsWithTopTier = [
    'models/gemini-2.5-flash',
    'models/gemini-3.8-flash',
    'models/gemini-3.5-flash',
  ];
  // 3.8-flash is index 0
  assert.equal(selectOptimalModel(modelsWithTopTier), 'gemini-3.8-flash');
});

test('TC-MOD-04: selectOptimalModel picks any flash model if exact cascade match is absent', () => {
  const futureModels = ['models/gemini-4.0-flash-pro', 'models/bison-001'];
  const chosen = selectOptimalModel(futureModels);
  assert.equal(chosen, 'gemini-4.0-flash-pro');
});

test('TC-MOD-05: selectOptimalModel falls back to first available model if no flash model is present', () => {
  const legacyModels = ['models/chat-bison-001', 'models/text-bison-001'];
  const chosen = selectOptimalModel(legacyModels);
  assert.equal(chosen, 'chat-bison-001');
});

test('TC-MOD-06: isRetryableModelError accurately classifies HTTP statuses and error messages', () => {
  assert.equal(isRetryableModelError(404), true, '404 not found should retry');
  assert.equal(isRetryableModelError(429), true, '429 rate limit should retry');
  assert.equal(isRetryableModelError(503), true, '503 service unavailable should retry');
  assert.equal(isRetryableModelError(200), false, '200 OK should not retry');
  assert.equal(isRetryableModelError(400, 'Invalid argument'), false, 'Standard 400 should not retry');

  // Error message checks
  assert.equal(isRetryableModelError(400, 'Resource has been exhausted (quota exceeded)'), true);
  assert.equal(isRetryableModelError(400, 'Rate limit reached'), true);
  assert.equal(isRetryableModelError(400, 'Model not found for this account'), true);
});

/* =========================================================================
 * INTEGRATION TESTS: Error Reporting & Edge Cases (test-key/route.ts)
 * ========================================================================= */

test('TC-API-KEY-EXT-01: Handles Google HTTP 403 (Permission Denied) with clear diagnostic', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        error: {
          code: 403,
          message: 'Method doesn\'t allow unregistered callers (caller has been blocked or permission denied)',
          status: 'PERMISSION_DENIED',
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyBlockedKeyRestricted123' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.valid, false);
    assert.ok(data.error.includes('Permission Denied'));
    assert.ok(data.error.includes('403'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-EXT-02: Handles Google HTTP 429 (Rate Limit on ListModels) with helpful retry prompt', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        error: {
          code: 429,
          message: 'Resource exhausted (Rate limit exceeded on metadata API)',
          status: 'RESOURCE_EXHAUSTED',
        },
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyTooManyRequestsMock123' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 429);
    const data = await res.json();
    assert.equal(data.valid, false);
    assert.ok(data.error.includes('Rate limit 429'));
    assert.ok(data.error.includes('thử lại sau giây lát'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-EXT-03: Handles network failure (DNS / Socket / 502) with diagnostic error', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new TypeError('fetch failed: ENOTFOUND generativelanguage.googleapis.com');
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyValidKeyNetworkDown123' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 502);
    const data = await res.json();
    assert.equal(data.valid, false);
    assert.ok(data.error.includes('Lỗi kết nối mạng'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-EXT-04: Gracefully filters models without supportedGenerationMethods by name', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        models: [
          { name: 'models/gemini-2.0-flash' }, // No supportedGenerationMethods, but name has gemini
          { name: 'models/imagen-3.0-generate-002' }, // No gemini, no supportedGenerationMethods
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyValidKeyWithLegacyList123' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.valid, true);
    assert.equal(data.model, 'gemini-2.0-flash');
    assert.equal(data.availableModelsCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
