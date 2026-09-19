import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAdaptiveIntervention } from '../lib/interventions/engine';
import { TrendAnalysisResult, Intervention } from '../lib/supabase/types';

function createMockTrend(overrides: Partial<TrendAnalysisResult> = {}): TrendAnalysisResult {
  return {
    projectId: 'proj-adaptive-test',
    windowStart: '2026-09-01',
    windowEnd: '2026-09-20',
    slope: -0.22,
    rSquared: 0.88,
    flagType: 'declining',
    isSuddenDrop: false,
    suddenDropDiff: 0,
    dataPointCount: 7,
    stdDev: 1.0,
    averageScore: 5.0,
    historicalTrendLine: [],
    ...overrides,
  };
}

test('TC-ADA-01: generateAdaptiveIntervention - Moderate Energy (4 < E < 7) without keywords defaults to break_task', async () => {
  const trend = createMockTrend({ flagType: 'declining', slope: -0.18 });

  const result = await generateAdaptiveIntervention({
    projectId: 'p1',
    projectName: 'BIM Pipeline',
    trendAnalysis: trend,
    recentAverageEnergy: 5.5,
    enableAI: false,
  });

  assert.equal(result.shouldIntervene, true);
  assert.equal(result.suggestionType, 'break_task');
  assert.ok(result.templateId);
  assert.ok(result.tone);
  assert.ok(result.actionStep);
  assert.ok(result.message?.includes('BIM Pipeline'));
});

test('TC-ADA-02: generateAdaptiveIntervention - 7-day cooldown suppresses non-urgent intervention', async () => {
  const trend = createMockTrend({ flagType: 'declining', slope: -0.25 });
  const recentInt: Intervention = {
    id: 'int-recent-3d',
    project_id: 'p1',
    suggestion_type: 'break_task',
    message: 'Previous intervention',
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago (< 7 days)
  };

  const result = await generateAdaptiveIntervention({
    projectId: 'p1',
    projectName: 'BIM Pipeline',
    trendAnalysis: trend,
    recentInterventions: [recentInt],
    enableAI: false,
  });

  assert.equal(result.shouldIntervene, false);
  assert.ok(result.reason?.includes('cooldown'));
});

test('TC-ADA-03: generateAdaptiveIntervention - Acute drop overrides 7-day cooldown', async () => {
  const trend = createMockTrend({
    flagType: 'stable',
    isSuddenDrop: true,
    suddenDropDiff: 4.2,
  });

  const recentInt: Intervention = {
    id: 'int-recent-1d',
    project_id: 'p1',
    suggestion_type: 'break_task',
    message: 'Yesterday intervention',
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // 1 day ago
  };

  const result = await generateAdaptiveIntervention({
    projectId: 'p1',
    projectName: 'Emergency Project',
    trendAnalysis: trend,
    recentInterventions: [recentInt],
    enableAI: false,
  });

  assert.equal(result.shouldIntervene, true, 'Acute crisis must bypass active cooldown');
  assert.equal(result.suggestionType, 'take_break');
});

test('TC-ADA-04: generateAdaptiveIntervention - Volatile trend triggers change_approach', async () => {
  const trend = createMockTrend({
    flagType: 'volatile',
    slope: 0.02,
    stdDev: 2.4,
  });

  const result = await generateAdaptiveIntervention({
    projectId: 'p1',
    projectName: 'Oscillating Project',
    trendAnalysis: trend,
    enableAI: false,
  });

  assert.equal(result.shouldIntervene, true);
  assert.equal(result.suggestionType, 'change_approach');
});

test('TC-ADA-05: generateAdaptiveIntervention - Stable or Improving suppresses intervention', async () => {
  const stableTrend = createMockTrend({ flagType: 'stable', slope: 0.02 });
  const resStable = await generateAdaptiveIntervention({
    projectId: 'p1',
    projectName: 'Stable Project',
    trendAnalysis: stableTrend,
  });
  assert.equal(resStable.shouldIntervene, false);

  const improvingTrend = createMockTrend({ flagType: 'improving', slope: 0.25 });
  const resImproving = await generateAdaptiveIntervention({
    projectId: 'p1',
    projectName: 'Improving Project',
    trendAnalysis: improvingTrend,
  });
  assert.equal(resImproving.shouldIntervene, false);
});

test('TC-ADA-06: generateAdaptiveIntervention - AI enabled with missing API key gracefully falls back to template', async () => {
  const trend = createMockTrend({ flagType: 'declining', slope: -0.22 });

  // ensure no API key is present during test
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;

  try {
    const result = await generateAdaptiveIntervention({
      projectId: 'p1',
      projectName: 'Fallback Project',
      trendAnalysis: trend,
      latestContextNote: 'Rất mệt mỏi và không muốn làm gì cả trong suốt tuần qua',
      enableAI: true,
    });

    assert.equal(result.shouldIntervene, true);
    assert.ok(result.message);
    assert.ok(result.templateId, 'Should successfully populate templateId from fallback template');
    assert.ok(result.actionStep, 'Should successfully populate actionStep from fallback template');
  } finally {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  }
});
