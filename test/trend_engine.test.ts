import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSuddenDrop, analyzeProjectTrend } from '../lib/trend/regression';
import { TREND_THRESHOLDS } from '../lib/trend/thresholds';
import { Checkin } from '../lib/supabase/types';

test('TC-DRP-01: detectSuddenDrop - Acute drop >= 3.5 points within 48h', () => {
  const now = Date.now();
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 8, created_at: new Date(now - 24 * 3600 * 1000).toISOString() },
    { id: '2', project_id: 'p1', score: 4, created_at: new Date(now).toISOString() },
  ];
  const res = detectSuddenDrop(checkins);
  assert.equal(res.isSuddenDrop, true);
  assert.equal(res.diff, 4);
});

test('TC-DRP-02: detectSuddenDrop - Drop >= 3.5 points but outside 48h window (> 48h)', () => {
  const now = Date.now();
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 9, created_at: new Date(now - 72 * 3600 * 1000).toISOString() },
    { id: '2', project_id: 'p1', score: 4, created_at: new Date(now).toISOString() },
  ];
  const res = detectSuddenDrop(checkins);
  assert.equal(res.isSuddenDrop, false);
  assert.equal(res.diff, 0);
});

test('TC-DRP-03: detectSuddenDrop - Drop < 3.5 points within 48h (mild decrease)', () => {
  const now = Date.now();
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 7, created_at: new Date(now - 12 * 3600 * 1000).toISOString() },
    { id: '2', project_id: 'p1', score: 5, created_at: new Date(now).toISOString() },
  ];
  const res = detectSuddenDrop(checkins);
  assert.equal(res.isSuddenDrop, false);
  assert.equal(res.diff, 0);
});

test('TC-DRP-04: detectSuddenDrop - Boundary: Empty and single check-in', () => {
  assert.deepEqual(detectSuddenDrop([]), { isSuddenDrop: false, diff: 0 });
  const singleCheckin: Checkin[] = [
    { id: '1', project_id: 'p1', score: 2, created_at: new Date().toISOString() },
  ];
  assert.deepEqual(detectSuddenDrop(singleCheckin), { isSuddenDrop: false, diff: 0 });
});

test('TC-DRP-05: detectSuddenDrop - Rejects inverted/future timestamps (hoursDiff < 0)', () => {
  const now = Date.now();
  // If timestamps are unordered where prev is in the future relative to latest (hoursDiff < 0)
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 9, created_at: new Date(now + 24 * 3600 * 1000).toISOString() }, // future
    { id: '2', project_id: 'p1', score: 3, created_at: new Date(now).toISOString() },
  ];
  const res = detectSuddenDrop(checkins);
  assert.equal(res.isSuddenDrop, false, 'Inverted or future timestamps must not be classified as sudden drop');
  assert.equal(res.diff, 0);
});

test('TC-TRD-01: analyzeProjectTrend - Filters out checkins outside the 21-day sliding window', () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const checkins: Checkin[] = [
    // Old checkins (older than 21 days)
    { id: 'old-1', project_id: 'p1', score: 2, created_at: new Date(now - 30 * dayMs).toISOString() },
    { id: 'old-2', project_id: 'p1', score: 2, created_at: new Date(now - 25 * dayMs).toISOString() },
    // In-window checkins (within 21 days)
    { id: 'w-1', project_id: 'p1', score: 8, created_at: new Date(now - 12 * dayMs).toISOString() },
    { id: 'w-2', project_id: 'p1', score: 8, created_at: new Date(now - 10 * dayMs).toISOString() },
    { id: 'w-3', project_id: 'p1', score: 8, created_at: new Date(now - 8 * dayMs).toISOString() },
    { id: 'w-4', project_id: 'p1', score: 8, created_at: new Date(now - 4 * dayMs).toISOString() },
    { id: 'w-5', project_id: 'p1', score: 8, created_at: new Date(now).toISOString() },
  ];

  const analysis = analyzeProjectTrend('p1', checkins);
  assert.equal(analysis.dataPointCount, 5, 'Should only count 5 checkins within sliding window');
  assert.equal(analysis.averageScore, 8.0);
  assert.equal(analysis.flagType, 'stable');
});

test('TC-TRD-02: analyzeProjectTrend - Returns safe defaults when zero checkins exist in window', () => {
  const analysis = analyzeProjectTrend('empty-proj', []);
  assert.equal(analysis.projectId, 'empty-proj');
  assert.equal(analysis.dataPointCount, 0);
  assert.equal(analysis.slope, 0);
  assert.equal(analysis.averageScore, 5);
  assert.equal(analysis.flagType, 'stable');
  assert.equal(analysis.isSuddenDrop, false);
  assert.deepEqual(analysis.historicalTrendLine, []);
});

test('TC-TRD-03: analyzeProjectTrend - Low sample size (< 5 points) remains stable despite steep slope', () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  // 4 points with steep decline
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 9, created_at: new Date(now - 6 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 7, created_at: new Date(now - 4 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 5, created_at: new Date(now - 2 * dayMs).toISOString() },
    { id: '4', project_id: 'p1', score: 3, created_at: new Date(now).toISOString() },
  ];

  const analysis = analyzeProjectTrend('p1', checkins);
  assert.equal(analysis.dataPointCount, 4);
  assert.ok(analysis.slope <= -0.15, 'Slope is declining');
  assert.equal(analysis.flagType, 'stable', 'Low sample size must fall back to stable to prevent false alarms');
});

test('TC-TRD-04: analyzeProjectTrend - Improving trend (>= 5 points, slope >= 0.10)', () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 3, created_at: new Date(now - 12 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 4, created_at: new Date(now - 9 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 6, created_at: new Date(now - 6 * dayMs).toISOString() },
    { id: '4', project_id: 'p1', score: 7, created_at: new Date(now - 3 * dayMs).toISOString() },
    { id: '5', project_id: 'p1', score: 9, created_at: new Date(now).toISOString() },
  ];

  const analysis = analyzeProjectTrend('p1', checkins);
  assert.equal(analysis.flagType, 'improving');
  assert.ok(analysis.slope >= TREND_THRESHOLDS.IMPROVING_SLOPE_THRESHOLD);
});

test('TC-TRD-05: analyzeProjectTrend - Volatile trend (stdDev >= 2.0 without strong linear slope)', () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  // Scores jumping up and down with net zero slope: 3 -> 9 -> 3 -> 9 -> 3 -> 9 -> 3
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 3, created_at: new Date(now - 12 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 9, created_at: new Date(now - 10 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 3, created_at: new Date(now - 8 * dayMs).toISOString() },
    { id: '4', project_id: 'p1', score: 9, created_at: new Date(now - 6 * dayMs).toISOString() },
    { id: '5', project_id: 'p1', score: 3, created_at: new Date(now - 4 * dayMs).toISOString() },
    { id: '6', project_id: 'p1', score: 9, created_at: new Date(now - 2 * dayMs).toISOString() },
    { id: '7', project_id: 'p1', score: 3, created_at: new Date(now).toISOString() },
  ];

  const analysis = analyzeProjectTrend('p1', checkins);
  assert.equal(analysis.flagType, 'volatile');
  assert.ok(analysis.stdDev >= TREND_THRESHOLDS.VOLATILITY_STD_DEV_THRESHOLD);
});

test('TC-TRD-06: analyzeProjectTrend - Predicted scores are clamped between 1 and 10', () => {
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  // Huge downward trajectory
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 10, created_at: new Date(now - 10 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 8, created_at: new Date(now - 8 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 6, created_at: new Date(now - 6 * dayMs).toISOString() },
    { id: '4', project_id: 'p1', score: 4, created_at: new Date(now - 4 * dayMs).toISOString() },
    { id: '5', project_id: 'p1', score: 2, created_at: new Date(now - 2 * dayMs).toISOString() },
    { id: '6', project_id: 'p1', score: 1, created_at: new Date(now).toISOString() },
  ];

  const analysis = analyzeProjectTrend('p1', checkins);
  for (const pt of analysis.historicalTrendLine) {
    if (pt.predictedScore !== undefined) {
      assert.ok(pt.predictedScore >= 1, `Predicted score ${pt.predictedScore} must be >= 1`);
      assert.ok(pt.predictedScore <= 10, `Predicted score ${pt.predictedScore} must be <= 10`);
    }
  }
});
