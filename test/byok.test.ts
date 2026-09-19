/**
 * Test Suite: Bring Your Own Key (BYOK) & Hybrid AI Key Architecture
 * 
 * Tests priority resolution of user-provided API keys over server environment keys,
 * graceful fallback to template pool, and the key testing endpoint.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { synthesizeAIIntervention } from '../lib/interventions/ai/synthesizer';
import { generateAdaptiveIntervention } from '../lib/interventions/engine';
import { GEMINI_MODEL_CASCADE, isRetryableModelError } from '../lib/interventions/ai/models';
import { TrendAnalysisResult } from '../lib/supabase/types';
import { POST as testKeyHandler } from '../app/api/ai/test-key/route';
import { NextRequest } from 'next/server';

describe('Bring Your Own Key (BYOK) & Key Priority Resolution', () => {
  const dummyTrend: TrendAnalysisResult = {
    projectId: 'proj-001',
    windowStart: '2026-09-01T00:00:00Z',
    windowEnd: '2026-09-19T00:00:00Z',
    slope: -0.25,
    rSquared: 0.85,
    flagType: 'declining',
    isSuddenDrop: false,
    dataPointCount: 7,
    stdDev: 1.2,
    averageScore: 4.5,
    historicalTrendLine: [],
  };

  it('TC-BYOK-01: Rejects short or empty context notes to prevent hallucination regardless of key', async () => {
    const result = await synthesizeAIIntervention({
      projectName: 'Test Project',
      slope: -0.2,
      recentAverageEnergy: 5,
      recentContextNotes: ['ngắn', 'ok'],
      chosenCategory: 'break_task',
      userProvidedApiKey: 'AIzaSyDummyTestKey1234567890',
    });

    assert.strictEqual(result, null);
  });

  it('TC-BYOK-02: Falls back gracefully to null when API key is missing or invalid', async () => {
    const savedEnvKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    try {
      const result = await synthesizeAIIntervention({
        projectName: 'Test Project',
        slope: -0.2,
        recentAverageEnergy: 5,
        recentContextNotes: ['Đây là một ghi chú khá dài và đầy đủ ngữ cảnh để kiểm tra'],
        chosenCategory: 'break_task',
        userProvidedApiKey: undefined,
      });

      assert.strictEqual(result, null);
    } finally {
      if (savedEnvKey) process.env.GEMINI_API_KEY = savedEnvKey;
    }
  });

  it('TC-BYOK-03: generateAdaptiveIntervention accepts userProvidedApiKey and falls back to template', async () => {
    const result = await generateAdaptiveIntervention({
      projectId: 'proj-001',
      projectName: 'Test Project',
      trendAnalysis: dummyTrend,
      latestContextNote: 'Gặp bug rất khó và phức tạp khiến cả tuần nay bế tắc chưa tìm ra giải pháp',
      userProvidedApiKey: 'AIzaSyInvalidKeyForTestingFallback',
      enableAI: true,
    });

    assert.strictEqual(result.shouldIntervene, true);
    assert.strictEqual(result.suggestionType, 'break_task');
    assert.ok(result.message && result.message.length > 20);
    assert.ok(result.templateId !== undefined);
  });

  it('TC-BYOK-04: POST /api/ai/test-key validates input length and rejects missing key with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/test-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'too_short' }),
    });

    const res = await testKeyHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.valid, false);
    assert.ok(data.error.includes('Vui lòng nhập API Key'));
  });

  it('TC-BYOK-05: GEMINI_MODEL_CASCADE contains tiered models with Flash and Flash-Lite reserves', () => {
    assert.ok(GEMINI_MODEL_CASCADE.length >= 6, 'Cascade must have at least 6 candidate models');
    assert.ok(GEMINI_MODEL_CASCADE.includes('gemini-3.8-flash'), 'Should include flagship 3.8 Flash');
    assert.ok(GEMINI_MODEL_CASCADE.includes('gemini-3.5-flash-lite'), 'Should include high-quota 3.5 Flash Lite');
    assert.ok(GEMINI_MODEL_CASCADE.includes('gemini-2.5-flash'), 'Should include 2.5 Flash fallback');
  });

  it('TC-BYOK-06: isRetryableModelError identifies 404, 429, 503 and resource exhausted errors', () => {
    assert.strictEqual(isRetryableModelError(404), true);
    assert.strictEqual(isRetryableModelError(429), true);
    assert.strictEqual(isRetryableModelError(503), true);
    assert.strictEqual(isRetryableModelError(400, 'models/gemini-1.5-flash is not found'), true);
    assert.strictEqual(isRetryableModelError(400, 'Quota exceeded for quota metric'), true);
    assert.strictEqual(isRetryableModelError(400, 'API_KEY_INVALID'), false);
  });
});

