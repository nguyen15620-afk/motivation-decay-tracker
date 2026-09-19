import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as testKeyHandler } from '../app/api/ai/test-key/route';

test('TC-API-KEY-01: Rejects missing or empty apiKey with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const res = await testKeyHandler(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.valid, false);
  assert.ok(data.error.includes('Vui lòng nhập API Key'));
});

test('TC-API-KEY-02: Rejects apiKey shorter than 10 chars with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
    method: 'POST',
    body: JSON.stringify({ apiKey: '1234567' }),
  });

  const res = await testKeyHandler(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.valid, false);
});

test('TC-API-KEY-03: Returns 200 and active model when first model succeeds', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'pong' }] } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyMockTestKeyValid123456789' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.valid, true);
    assert.equal(data.model, 'gemini-3.8-flash');
    assert.ok(data.message.includes('gemini-3.8-flash'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-04: Cascades to next model on 404 and returns newly activated model', async () => {
  const originalFetch = globalThis.fetch;
  const attemptedModels: string[] = [];

  globalThis.fetch = async (url: any) => {
    const urlStr = String(url);
    const modelMatch = urlStr.match(/models\/([^:]+):/);
    const model = modelMatch ? modelMatch[1] : 'unknown';
    attemptedModels.push(model);

    if (model === 'gemini-3.8-flash') {
      return new Response(JSON.stringify({ error: { message: 'Model not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'pong' }] } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyMockTestKeyValid123456789' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.valid, true);
    assert.equal(data.model, 'gemini-3.7-flash');
    assert.ok(attemptedModels.includes('gemini-3.8-flash'));
    assert.ok(attemptedModels.includes('gemini-3.7-flash'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-05: Returns 400 immediately when Google reports API_KEY_INVALID', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts++;
    return new Response(
      JSON.stringify({
        error: { message: 'API_KEY_INVALID: The provided API key is invalid' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyBadKeyDefinitelyFake123' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.valid, false);
    assert.ok(data.error.includes('API Key không hợp lệ hoặc đã bị vô hiệu hóa'));
    assert.equal(attempts, 1, 'Should fail immediately without retrying cascade on bad key');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
