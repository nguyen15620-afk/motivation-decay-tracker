import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLinearRegression, calculateStdDev, detectSuddenDrop, analyzeProjectTrend } from '../lib/trend/regression';
import { evaluateAndGenerateIntervention } from '../lib/interventions/generate';
import { Checkin } from '../lib/supabase/types';

test('1. Linear Regression: Accurately calculates negative slope for decaying scores', () => {
  const points = [
    { x: 0, y: 10 },
    { x: 1, y: 9 },
    { x: 2, y: 8 },
    { x: 3, y: 7 },
    { x: 4, y: 6 },
  ];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, -1.0);
  assert.equal(res.intercept, 10.0);
  assert.equal(res.rSquared, 1.0);
});

test('2. Linear Regression: Accurately calculates positive slope for improving scores', () => {
  const points = [
    { x: 0, y: 3 },
    { x: 1, y: 5 },
    { x: 2, y: 7 },
    { x: 3, y: 9 },
  ];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, 2.0);
  assert.equal(res.intercept, 3.0);
  assert.equal(res.rSquared, 1.0);
});

test('3. Sudden Drop Detection: Detects acute drop >= 3.5 points within 48h', () => {
  const now = Date.now();
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 8, created_at: new Date(now - 20 * 3600 * 1000).toISOString() },
    { id: '2', project_id: 'p1', score: 3, created_at: new Date(now).toISOString() },
  ];
  const result = detectSuddenDrop(checkins, 3.5);
  assert.equal(result.isSuddenDrop, true);
  assert.equal(result.diff, 5);
});

test('4. Full Trend Analysis: Classifies decaying project and computes historical line', () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const checkins: Checkin[] = [
    { id: '1', project_id: 'proj-1', score: 9, created_at: new Date(now - 10 * dayMs).toISOString() },
    { id: '2', project_id: 'proj-1', score: 8, created_at: new Date(now - 8 * dayMs).toISOString() },
    { id: '3', project_id: 'proj-1', score: 7, created_at: new Date(now - 6 * dayMs).toISOString() },
    { id: '4', project_id: 'proj-1', score: 6, created_at: new Date(now - 4 * dayMs).toISOString() },
    { id: '5', project_id: 'proj-1', score: 5, created_at: new Date(now - 2 * dayMs).toISOString() },
    { id: '6', project_id: 'proj-1', score: 4, created_at: new Date(now).toISOString() },
  ];

  const analysis = analyzeProjectTrend('proj-1', checkins);
  assert.equal(analysis.flagType, 'declining');
  assert.ok(analysis.slope < -0.15);
  assert.equal(analysis.dataPointCount, 6);
  assert.equal(analysis.historicalTrendLine.length, 6);
});

test('5. Intervention Generator: Triggers break_task on gradual decay and take_break on sudden drop', () => {
  const decayingAnalysis = {
    projectId: 'p-decay',
    windowStart: '2026-09-01',
    windowEnd: '2026-09-20',
    slope: -0.22,
    rSquared: 0.85,
    flagType: 'declining' as const,
    isSuddenDrop: false,
    dataPointCount: 6,
    stdDev: 1.2,
    averageScore: 5.5,
    historicalTrendLine: [],
  };

  const intervention1 = evaluateAndGenerateIntervention({
    projectId: 'p-decay',
    projectName: 'pyRevit MEP Tools',
    trendAnalysis: decayingAnalysis,
    latestContextNote: 'Nhiều việc quá ngập đầu',
  });

  assert.equal(intervention1.shouldIntervene, true);
  assert.equal(intervention1.suggestionType, 'break_task');

  // Acute Sudden Drop
  const suddenDropAnalysis = {
    ...decayingAnalysis,
    isSuddenDrop: true,
    suddenDropDiff: 4.5,
  };

  const intervention2 = evaluateAndGenerateIntervention({
    projectId: 'p-sudden',
    projectName: 'Smoke Control',
    trendAnalysis: suddenDropAnalysis,
  });

  assert.equal(intervention2.shouldIntervene, true);
  assert.equal(intervention2.suggestionType, 'take_break');
});
