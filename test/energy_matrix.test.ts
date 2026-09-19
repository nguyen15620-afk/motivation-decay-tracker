import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAndGenerateIntervention } from '../lib/interventions/generate';
import { TrendAnalysisResult } from '../lib/supabase/types';

function mockTrend(overrides: Partial<TrendAnalysisResult> = {}): TrendAnalysisResult {
  return {
    projectId: 'test-proj',
    windowStart: '2026-09-01',
    windowEnd: '2026-09-20',
    slope: -0.22,
    rSquared: 0.85,
    flagType: 'declining',
    isSuddenDrop: false,
    suddenDropDiff: 0,
    dataPointCount: 7,
    stdDev: 1.1,
    averageScore: 4.8,
    historicalTrendLine: [],
    ...overrides,
  };
}

test('TC-ENG-01: Low Energy (E <= 4) with Declining motivation classifies as Physical Exhaustion -> take_break', () => {
  const trend = mockTrend({
    flagType: 'declining',
    slope: -0.25,
    recentAverageEnergy: 3.0, // Low energy
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'pyRevit MEP Tools',
    trendAnalysis: trend,
    recentAverageEnergy: 3.0,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(
    res.suggestionType,
    'take_break',
    'Low physical energy (< 4) must prioritize biological recovery (take_break)'
  );
  assert.ok(res.templateId);
  assert.ok(res.tone);
});

test('TC-ENG-02: High Energy (E >= 7) with Declining motivation classifies as Cognitive Blocker -> break_task', () => {
  const trend = mockTrend({
    flagType: 'declining',
    slope: -0.25,
    recentAverageEnergy: 8.0, // High physical energy
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'AI MEP Integration',
    trendAnalysis: trend,
    recentAverageEnergy: 8.0,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(
    res.suggestionType,
    'break_task',
    'High energy with declining motivation indicates cognitive ambiguity or friction (break_task)'
  );
  assert.ok(res.templateId);
  assert.ok(res.actionStep);
});

test('TC-ENG-03: Post-milestone context takes precedence over raw energy -> celebrate_progress', () => {
  const trend = mockTrend({
    flagType: 'declining',
    slope: -0.18,
    recentAverageEnergy: 4.0,
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'MotoCare Application',
    trendAnalysis: trend,
    latestContextNote: 'Vừa bàn giao bản release v1 cho khách hàng',
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(
    res.suggestionType,
    'celebrate_progress',
    'Milestone keywords must trigger celebrate_progress (Hedonic adaptation insight)'
  );
});

test('TC-ENG-04: Acute sudden drop overrides normal energy matrix -> take_break', () => {
  const trend = mockTrend({
    flagType: 'stable',
    isSuddenDrop: true,
    suddenDropDiff: 4.5,
    recentAverageEnergy: 9.0, // Even if energy was high, acute drop requires immediate pause
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'Smoke Control',
    trendAnalysis: trend,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(res.suggestionType, 'take_break');
});
