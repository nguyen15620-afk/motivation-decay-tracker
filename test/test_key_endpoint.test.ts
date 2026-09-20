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

test('TC-API-KEY-03: Returns 200 and selects top priority model from ListModels metadata (Zero Quota)', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';

  globalThis.fetch = async (url: any) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify({
        models: [
          { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
        ],
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
    assert.ok(requestedUrl.includes('/v1beta/models?key=AIzaSyMockTestKeyValid123456789'));
    assert.equal(data.model, 'gemini-3.8-flash');
    assert.ok(data.message.includes('gemini-3.8-flash'));
    assert.equal(data.availableModelsCount, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-04: Selects best available fallback model when top flagship is not in account catalog', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        models: [
          { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
        ],
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
    // 3.5-flash-lite takes precedence over 2.5-flash
    assert.equal(data.model, 'gemini-3.5-flash-lite');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-05: Returns 400 immediately with honest message when Google reports API_KEY_INVALID', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async () => {
    callCount++;
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
    assert.ok(data.error.includes('API Key không hợp lệ hoặc chưa được kích hoạt'));
    assert.equal(callCount, 1, 'Single ListModels check suffices without wasting quota');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TC-API-KEY-06: Handles timeout honestly without falsely blaming quota exhaustion', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    throw abortErr;
  };

  try {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyValidKeySlowNetwork123' }),
    });

    const res = await testKeyHandler(req);
    assert.equal(res.status, 504);
    const data = await res.json();
    assert.equal(data.valid, false);
    assert.ok(data.error.includes('quá thời gian chờ 7s'));
    assert.ok(!data.error.includes('Hết hạn mức'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
