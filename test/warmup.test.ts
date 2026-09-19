/**
 * Test Suite: Early-Phase Warmup Engine (Cold-Start Gap)
 * 
 * Tests detection of early friction (< 5 check-ins) and kick-off momentum guidance.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluateEarlyPhaseWarmup } from '../lib/interventions/onboarding/warmup';
import { Checkin } from '../lib/supabase/types';

describe('Early-Phase Warmup (Cold-Start Gap)', () => {
  it('TC-WRM-01: Does not intervene when project has 0 or >= 5 check-ins', () => {
    // 0 check-ins
    assert.strictEqual(
      evaluateEarlyPhaseWarmup({ projectName: 'Test', checkins: [] }).shouldIntervene,
      false
    );

    // 5 check-ins (handled by standard OLS engine instead)
    const fiveCheckins: Checkin[] = [
      { id: '1', project_id: 'p1', score: 5, created_at: '2026-09-01T00:00:00Z' },
      { id: '2', project_id: 'p1', score: 4, created_at: '2026-09-02T00:00:00Z' },
      { id: '3', project_id: 'p1', score: 4, created_at: '2026-09-03T00:00:00Z' },
      { id: '4', project_id: 'p1', score: 3, created_at: '2026-09-04T00:00:00Z' },
      { id: '5', project_id: 'p1', score: 3, created_at: '2026-09-05T00:00:00Z' },
    ];
    assert.strictEqual(
      evaluateEarlyPhaseWarmup({ projectName: 'Test', checkins: fiveCheckins }).shouldIntervene,
      false
    );
  });

  it('TC-WRM-02: Suppresses intervention when early check-ins are healthy and strong', () => {
    const healthyCheckins: Checkin[] = [
      { id: '1', project_id: 'p1', score: 8, created_at: '2026-09-01T00:00:00Z' },
      { id: '2', project_id: 'p1', score: 8, created_at: '2026-09-02T00:00:00Z' },
      { id: '3', project_id: 'p1', score: 9, created_at: '2026-09-03T00:00:00Z' },
    ];

    const result = evaluateEarlyPhaseWarmup({ projectName: 'Test', checkins: healthyCheckins });
    assert.strictEqual(result.shouldIntervene, false);
  });

  it('TC-WRM-03: Triggers take_break on sharp early drop in first few days', () => {
    // Day 1: 8, Day 2: 3 (drop >= 3.0 points)
    const severeDropCheckins: Checkin[] = [
      { id: '1', project_id: 'p1', score: 8, created_at: '2026-09-01T00:00:00Z' },
      { id: '2', project_id: 'p1', score: 3, created_at: '2026-09-02T00:00:00Z' },
    ];

    const result = evaluateEarlyPhaseWarmup({ projectName: 'Web App', checkins: severeDropCheckins });
    assert.strictEqual(result.shouldIntervene, true);
    assert.strictEqual(result.suggestionType, 'take_break');
    assert.strictEqual(result.tone, 'compassionate');
    assert.ok(result.message?.includes('Web App'));
    assert.ok(result.actionStep?.includes('giấy nháp'));
  });

  it('TC-WRM-04: Triggers break_task (Tiny Kick-off) when early average score is low', () => {
    // Scores: 4, 5, 4 (Average <= 5.0)
    const lowAvgCheckins: Checkin[] = [
      { id: '1', project_id: 'p1', score: 4, created_at: '2026-09-01T00:00:00Z' },
      { id: '2', project_id: 'p1', score: 5, created_at: '2026-09-02T00:00:00Z' },
      { id: '3', project_id: 'p1', score: 4, created_at: '2026-09-03T00:00:00Z' },
    ];

    const result = evaluateEarlyPhaseWarmup({ projectName: 'Learn Rust', checkins: lowAvgCheckins });
    assert.strictEqual(result.shouldIntervene, true);
    assert.strictEqual(result.suggestionType, 'break_task');
    assert.strictEqual(result.tone, 'action_oriented');
    assert.ok(result.templateId === 'warmup_tiny_kickoff');
    assert.ok(result.actionStep?.includes('5 phút'));
  });
});
