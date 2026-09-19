import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAndGenerateIntervention } from '../lib/interventions/generate';
import { TrendAnalysisResult, Intervention } from '../lib/supabase/types';

function createMockTrend(overrides: Partial<TrendAnalysisResult> = {}): TrendAnalysisResult {
  return {
    projectId: 'test-project',
    windowStart: '2026-09-01',
    windowEnd: '2026-09-20',
    slope: -0.18,
    rSquared: 0.8,
    flagType: 'declining',
    isSuddenDrop: false,
    suddenDropDiff: 0,
    dataPointCount: 6,
    stdDev: 1.0,
    averageScore: 5.5,
    historicalTrendLine: [],
    ...overrides,
  };
}

test('TC-INT-01: Acute Sudden Drop triggers "take_break" suggestion', () => {
  const trend = createMockTrend({
    isSuddenDrop: true,
    suddenDropDiff: 4.5,
    flagType: 'stable',
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'Smoke Control',
    trendAnalysis: trend,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(res.suggestionType, 'take_break');
  assert.ok(res.message?.includes('nghỉ ngơi'));
});

test('TC-INT-02: Acute Sudden Drop bypasses active 7-day cooldown', () => {
  const trend = createMockTrend({
    isSuddenDrop: true,
    suddenDropDiff: 4.0,
  });

  const lastIntervention: Intervention = {
    id: 'int-recent',
    project_id: 'p1',
    suggestion_type: 'break_task',
    message: 'Can thiệp gần đây',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
  };

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'Smoke Control',
    trendAnalysis: trend,
    lastIntervention,
  });

  assert.equal(res.shouldIntervene, true, 'Sudden drop crisis must bypass 7-day cooldown');
  assert.equal(res.suggestionType, 'take_break');
});

test('TC-INT-03: Gradual decline within 7-day cooldown is suppressed (Anti-spam)', () => {
  const trend = createMockTrend({
    isSuddenDrop: false,
    flagType: 'declining',
    slope: -0.22,
  });

  const lastIntervention: Intervention = {
    id: 'int-recent',
    project_id: 'p1',
    suggestion_type: 'break_task',
    message: 'Can thiệp cũ',
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago (< 7)
  };

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'pyRevit Tools',
    trendAnalysis: trend,
    lastIntervention,
  });

  assert.equal(res.shouldIntervene, false);
  assert.ok(res.reason?.includes('cooldown'));
});

test('TC-INT-04: Gradual decline triggers after cooldown has elapsed (> 7 days)', () => {
  const trend = createMockTrend({
    isSuddenDrop: false,
    flagType: 'declining',
    slope: -0.25,
  });

  const lastIntervention: Intervention = {
    id: 'int-old',
    project_id: 'p1',
    suggestion_type: 'break_task',
    message: 'Can thiệp 10 ngày trước',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // 10 days ago (> 7)
  };

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'pyRevit Tools',
    trendAnalysis: trend,
    lastIntervention,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(res.suggestionType, 'break_task');
});

test('TC-INT-05: Hedonic Adaptation - Milestone keyword triggers "celebrate_progress"', () => {
  const trend = createMockTrend({
    flagType: 'declining',
    slope: -0.16,
  });

  const notes = [
    'Vừa hoàn thành milestone số 2',
    'Đã release xong phiên bản beta',
    'Bàn giao tài liệu xong',
  ];

  for (const note of notes) {
    const res = evaluateAndGenerateIntervention({
      projectId: 'p1',
      projectName: 'pyRevit Tools',
      trendAnalysis: trend,
      latestContextNote: note,
    });
    assert.equal(res.shouldIntervene, true);
    assert.equal(res.suggestionType, 'celebrate_progress', `Note "${note}" should trigger celebrate_progress`);
    assert.ok(res.message?.includes('Hedonic Adaptation'));
  }
});

test('TC-INT-06: Overwhelmed keywords or steep drop (<= -0.2) triggers "break_task"', () => {
  const trend = createMockTrend({
    flagType: 'declining',
    slope: -0.16,
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'pyRevit Tools',
    trendAnalysis: trend,
    latestContextNote: 'Nhiều việc quá ngập đầu bế tắc deadline dí',
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(res.suggestionType, 'break_task');
  assert.ok(res.message?.includes('15 phút'));
});

test('TC-INT-07: Volatile motivation triggers "change_approach"', () => {
  const trend = createMockTrend({
    flagType: 'volatile',
    slope: 0.02,
    stdDev: 2.3,
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'AI MEP',
    trendAnalysis: trend,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(res.suggestionType, 'change_approach');
  assert.ok(res.message?.includes('dao động'));
});

test('TC-INT-08: Stable or Improving project suppresses intervention', () => {
  const stableTrend = createMockTrend({ flagType: 'stable', slope: 0.01 });
  const resStable = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'Stable Project',
    trendAnalysis: stableTrend,
  });
  assert.equal(resStable.shouldIntervene, false);

  const improvingTrend = createMockTrend({ flagType: 'improving', slope: 0.35 });
  const resImproving = evaluateAndGenerateIntervention({
    projectId: 'p1',
    projectName: 'Growing Project',
    trendAnalysis: improvingTrend,
  });
  assert.equal(resImproving.shouldIntervene, false);
});
