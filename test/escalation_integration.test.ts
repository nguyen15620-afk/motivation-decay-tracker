import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAdaptiveIntervention } from '../lib/interventions/engine';
import { evaluateAndGenerateIntervention } from '../lib/interventions/generate';
import { TrendAnalysisResult, Checkin, Intervention } from '../lib/supabase/types';

function createMockTrend(overrides: Partial<TrendAnalysisResult> = {}): TrendAnalysisResult {
  return {
    projectId: 'p-escalation-test',
    windowStart: '2026-09-01',
    windowEnd: '2026-09-20',
    slope: -0.22,
    rSquared: 0.85,
    flagType: 'declining',
    isSuddenDrop: false,
    suddenDropDiff: 0,
    dataPointCount: 8,
    stdDev: 1.2,
    averageScore: 4.5,
    historicalTrendLine: [],
    ...overrides,
  };
}

test('TC-ESC-01: Escalates from break_task to change_approach when previous intervention was ineffective', async () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const interventionTime = now - 10 * dayMs;

  const previousIntervention: Intervention = {
    id: 'int-ineffective-1',
    project_id: 'p-esc',
    suggestion_type: 'break_task',
    template_id: 'bt_comp_friction_02',
    tone: 'compassionate',
    message: 'Hãy chia nhỏ việc',
    created_at: new Date(interventionTime).toISOString(),
  };

  // Pre-checkins: 8 -> 7 -> 6 (Slope ~ -0.5)
  // Post-checkins: 5 -> 4 -> 3 -> 2 (Decay accelerated! Slope ~ -1.0, Recovery Delta < 0)
  const checkins: Checkin[] = [
    { id: 'c-pre-1', project_id: 'p-esc', score: 8, created_at: new Date(interventionTime - 6 * dayMs).toISOString() },
    { id: 'c-pre-2', project_id: 'p-esc', score: 7, created_at: new Date(interventionTime - 3 * dayMs).toISOString() },
    { id: 'c-pre-3', project_id: 'p-esc', score: 6, created_at: new Date(interventionTime - 1 * dayMs).toISOString() },
    // Post
    { id: 'c-post-1', project_id: 'p-esc', score: 5, created_at: new Date(interventionTime + 2 * dayMs).toISOString() },
    { id: 'c-post-2', project_id: 'p-esc', score: 4, created_at: new Date(interventionTime + 4 * dayMs).toISOString() },
    { id: 'c-post-3', project_id: 'p-esc', score: 3, created_at: new Date(interventionTime + 6 * dayMs).toISOString() },
    { id: 'c-post-4', project_id: 'p-esc', score: 2, created_at: new Date(interventionTime + 8 * dayMs).toISOString() },
  ];

  const trend = createMockTrend({
    dataPointCount: 7,
    flagType: 'declining',
    slope: -0.3,
  });

  const res = await generateAdaptiveIntervention({
    projectId: 'p-esc',
    projectName: 'pyRevit Automation',
    trendAnalysis: trend,
    lastIntervention: previousIntervention,
    recentInterventions: [previousIntervention],
    checkins,
    recentAverageEnergy: 6.0, // Normal energy (would normally be break_task)
    enableAI: false,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(
    res.suggestionType,
    'change_approach',
    'Escalation Protocol must shift suggestion from break_task to change_approach'
  );
  assert.ok(res.templateId);
});

test('TC-ESC-02: Escalation does NOT override take_break when physical energy is low (Energy <= 4)', async () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const interventionTime = now - 10 * dayMs;

  const previousIntervention: Intervention = {
    id: 'int-ineffective-2',
    project_id: 'p-esc',
    suggestion_type: 'break_task',
    message: 'Cố gắng chia nhỏ việc',
    created_at: new Date(interventionTime).toISOString(),
  };

  const checkins: Checkin[] = [
    { id: 'c-pre-1', project_id: 'p-esc', score: 7, created_at: new Date(interventionTime - 4 * dayMs).toISOString() },
    { id: 'c-pre-2', project_id: 'p-esc', score: 6, created_at: new Date(interventionTime - 1 * dayMs).toISOString() },
    { id: 'c-post-1', project_id: 'p-esc', score: 4, created_at: new Date(interventionTime + 2 * dayMs).toISOString() },
    { id: 'c-post-2', project_id: 'p-esc', score: 3, created_at: new Date(interventionTime + 4 * dayMs).toISOString() },
    { id: 'c-post-3', project_id: 'p-esc', score: 2, created_at: new Date(interventionTime + 6 * dayMs).toISOString() },
  ];

  const trend = createMockTrend({
    dataPointCount: 5,
    flagType: 'declining',
    slope: -0.3,
  });

  const res = await generateAdaptiveIntervention({
    projectId: 'p-esc',
    projectName: 'pyRevit Automation',
    trendAnalysis: trend,
    lastIntervention: previousIntervention,
    recentInterventions: [previousIntervention],
    checkins,
    recentAverageEnergy: 2.5, // Low physical energy!
    enableAI: false,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(
    res.suggestionType,
    'take_break',
    'Physical exhaustion (Energy <= 4) must strictly preserve take_break even during escalation'
  );
});

test('TC-ESC-03: evaluateAndGenerateIntervention sync entrypoint respects escalation', () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const interventionTime = now - 10 * dayMs;

  const previousIntervention: Intervention = {
    id: 'int-ineffective-sync',
    project_id: 'p-esc',
    suggestion_type: 'break_task',
    created_at: new Date(interventionTime).toISOString(),
  };

  const checkins: Checkin[] = [
    { id: 'c-pre-1', project_id: 'p-esc', score: 8, created_at: new Date(interventionTime - 4 * dayMs).toISOString() },
    { id: 'c-pre-2', project_id: 'p-esc', score: 7, created_at: new Date(interventionTime - 1 * dayMs).toISOString() },
    { id: 'c-post-1', project_id: 'p-esc', score: 5, created_at: new Date(interventionTime + 2 * dayMs).toISOString() },
    { id: 'c-post-2', project_id: 'p-esc', score: 4, created_at: new Date(interventionTime + 4 * dayMs).toISOString() },
    { id: 'c-post-3', project_id: 'p-esc', score: 3, created_at: new Date(interventionTime + 6 * dayMs).toISOString() },
  ];

  const trend = createMockTrend({
    dataPointCount: 5,
    flagType: 'declining',
    slope: -0.35,
  });

  const res = evaluateAndGenerateIntervention({
    projectId: 'p-esc',
    projectName: 'pyRevit Automation',
    trendAnalysis: trend,
    lastIntervention: previousIntervention,
    recentInterventions: [previousIntervention],
    checkins,
    recentAverageEnergy: 6.0,
  });

  assert.equal(res.shouldIntervene, true);
  assert.equal(res.suggestionType, 'change_approach');
});
