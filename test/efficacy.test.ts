/**
 * Test Suite: Intervention Efficacy & Escalation Protocol
 * 
 * Tests calculation of Recovery Delta (Slope_post - Slope_pre)
 * and triggering of the Escalation Protocol.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluateInterventionEfficacy, checkEscalationStatus } from '../lib/interventions/analytics/efficacy';
import { Checkin, Intervention } from '../lib/supabase/types';

describe('Intervention Efficacy & Recovery Delta', () => {
  const mockIntervention: Intervention = {
    id: 'int-001',
    project_id: 'proj-001',
    suggestion_type: 'break_task',
    message: 'Thử chia nhỏ task...',
    created_at: '2026-09-10T12:00:00Z',
  };

  it('TC-EFF-01: Returns insufficient_data when fewer than 3 post-intervention checkins exist', () => {
    const checkins: Checkin[] = [
      { id: 'c1', project_id: 'proj-001', score: 8, created_at: '2026-09-08T12:00:00Z' },
      { id: 'c2', project_id: 'proj-001', score: 5, created_at: '2026-09-09T12:00:00Z' },
      // Only 1 post-intervention checkin
      { id: 'c3', project_id: 'proj-001', score: 6, created_at: '2026-09-11T12:00:00Z' },
    ];

    const result = evaluateInterventionEfficacy({
      intervention: mockIntervention,
      checkins,
    });

    assert.strictEqual(result.status, 'insufficient_data');
    assert.strictEqual(result.isEffective, false);
    assert.strictEqual(result.postCheckinCount, 1);
  });

  it('TC-EFF-02: Detects effective recovery when post-intervention slope strongly improves', () => {
    // Pre-intervention decaying: Day 0 -> 9, Day 1 -> 7, Day 2 -> 5 (Slope ~ -2.0)
    // Post-intervention recovering: Day 3 -> 5, Day 4 -> 7, Day 5 -> 9 (Slope ~ +2.0)
    const checkins: Checkin[] = [
      { id: 'c1', project_id: 'proj-001', score: 9, created_at: '2026-09-07T12:00:00Z' },
      { id: 'c2', project_id: 'proj-001', score: 7, created_at: '2026-09-08T12:00:00Z' },
      { id: 'c3', project_id: 'proj-001', score: 5, created_at: '2026-09-09T12:00:00Z' },
      // Intervention at 2026-09-10
      { id: 'c4', project_id: 'proj-001', score: 6, created_at: '2026-09-11T12:00:00Z' },
      { id: 'c5', project_id: 'proj-001', score: 7.5, created_at: '2026-09-12T12:00:00Z' },
      { id: 'c6', project_id: 'proj-001', score: 9, created_at: '2026-09-13T12:00:00Z' },
    ];

    const result = evaluateInterventionEfficacy({
      intervention: mockIntervention,
      checkins,
    });

    assert.strictEqual(result.status, 'effective');
    assert.strictEqual(result.isEffective, true);
    assert.ok(result.recoveryDelta > 0.1, `Recovery delta should be > 0.1, got ${result.recoveryDelta}`);
    assert.strictEqual(result.escalationRecommended, false);
  });

  it('TC-EFF-03: Flags ineffective intervention and recommends escalation when decay continues', () => {
    // Pre-intervention mild decline: Day 0 -> 6.0, Day 1 -> 5.5, Day 2 -> 5.0 (Slope ~ -0.5)
    // Post-intervention accelerated decay: Day 3 -> 4.5, Day 4 -> 3.0, Day 5 -> 1.5 (Slope ~ -1.5)
    // Recovery Delta: -1.5 - (-0.5) = -1.0 <= 0 (Slope_post <= Slope_pre)
    const checkins: Checkin[] = [
      { id: 'c1', project_id: 'proj-001', score: 6.0, created_at: '2026-09-07T12:00:00Z' },
      { id: 'c2', project_id: 'proj-001', score: 5.5, created_at: '2026-09-08T12:00:00Z' },
      { id: 'c3', project_id: 'proj-001', score: 5.0, created_at: '2026-09-09T12:00:00Z' },
      // Intervention at 2026-09-10
      { id: 'c4', project_id: 'proj-001', score: 4.5, created_at: '2026-09-11T12:00:00Z' },
      { id: 'c5', project_id: 'proj-001', score: 3.0, created_at: '2026-09-12T12:00:00Z' },
      { id: 'c6', project_id: 'proj-001', score: 1.5, created_at: '2026-09-13T12:00:00Z' },
    ];

    const result = evaluateInterventionEfficacy({
      intervention: mockIntervention,
      checkins,
    });

    assert.strictEqual(result.status, 'ineffective');
    assert.strictEqual(result.isEffective, false);
    assert.strictEqual(result.escalationRecommended, true);
  });

  it('TC-EFF-04: checkEscalationStatus triggers escalation when previous intervention failed', () => {
    const checkins: Checkin[] = [
      { id: 'c1', project_id: 'proj-001', score: 6.0, created_at: '2026-09-07T12:00:00Z' },
      { id: 'c2', project_id: 'proj-001', score: 5.5, created_at: '2026-09-08T12:00:00Z' },
      { id: 'c3', project_id: 'proj-001', score: 5.0, created_at: '2026-09-09T12:00:00Z' },
      // Post-intervention worsening
      { id: 'c4', project_id: 'proj-001', score: 4.5, created_at: '2026-09-11T12:00:00Z' },
      { id: 'c5', project_id: 'proj-001', score: 3.0, created_at: '2026-09-12T12:00:00Z' },
      { id: 'c6', project_id: 'proj-001', score: 1.5, created_at: '2026-09-13T12:00:00Z' },
    ];

    const status = checkEscalationStatus([mockIntervention], checkins);
    assert.strictEqual(status.escalationRequired, true);
    assert.ok(status.reason?.includes('Escalation Protocol'));
  });
});
