import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateInterventionEfficacy, checkEscalationStatus } from '../lib/interventions/analytics/efficacy';
import { Checkin, Intervention } from '../lib/supabase/types';

test('TC-EFF-EDGE-01: Handles flat pre-intervention scores (preSlope = 0) without NaN', () => {
  const interventionTime = 1000000000;
  const intervention: Intervention = {
    id: 'int-1',
    project_id: 'p1',
    suggestion_type: 'break_task',
    created_at: new Date(interventionTime).toISOString(),
  };

  const dayMs = 24 * 3600 * 1000;
  // Pre-scores are all identical (7, 7, 7) -> preSlope = 0
  // Post-scores improve (7 -> 8 -> 9 -> 10) -> postSlope > 0
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 7, created_at: new Date(interventionTime - 3 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 7, created_at: new Date(interventionTime - 2 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 7, created_at: new Date(interventionTime - 1 * dayMs).toISOString() },
    { id: '4', project_id: 'p1', score: 7, created_at: new Date(interventionTime + 1 * dayMs).toISOString() },
    { id: '5', project_id: 'p1', score: 8, created_at: new Date(interventionTime + 2 * dayMs).toISOString() },
    { id: '6', project_id: 'p1', score: 9, created_at: new Date(interventionTime + 3 * dayMs).toISOString() },
  ];

  const evalResult = evaluateInterventionEfficacy({ intervention, checkins });
  assert.equal(evalResult.preSlope, 0);
  assert.ok(evalResult.postSlope > 0);
  assert.ok(evalResult.recoveryDelta > 0.10);
  assert.equal(evalResult.status, 'effective');
  assert.equal(evalResult.isEffective, true);
  assert.equal(evalResult.escalationRecommended, false);
});

test('TC-EFF-EDGE-02: Partial recovery (0 <= Recovery Delta <= 0.10) classified as partial', () => {
  const interventionTime = 1000000000;
  const intervention: Intervention = {
    id: 'int-partial',
    project_id: 'p1',
    suggestion_type: 'break_task',
    created_at: new Date(interventionTime).toISOString(),
  };

  const dayMs = 24 * 3600 * 1000;
  // Pre: 7 -> 6 -> 5 (Days 0, 1, 2 -> Slope = -1.0)
  // Post: 5 -> 4.05 -> 3.1 (Days 1, 2, 3 -> Slope = -0.95 -> Delta = -0.95 - (-1.0) = +0.05)
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 7, created_at: new Date(interventionTime - 2 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 6, created_at: new Date(interventionTime - 1 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 5, created_at: new Date(interventionTime).toISOString() },
    { id: '4', project_id: 'p1', score: 5, created_at: new Date(interventionTime + 1 * dayMs).toISOString() },
    { id: '5', project_id: 'p1', score: 4.05, created_at: new Date(interventionTime + 2 * dayMs).toISOString() },
    { id: '6', project_id: 'p1', score: 3.1, created_at: new Date(interventionTime + 3 * dayMs).toISOString() },
  ];

  const evalResult = evaluateInterventionEfficacy({ intervention, checkins });
  assert.ok(evalResult.recoveryDelta >= 0 && evalResult.recoveryDelta <= 0.10);
  assert.equal(evalResult.status, 'partial');
  assert.equal(evalResult.isEffective, false);
  assert.equal(evalResult.escalationRecommended, false);
});

test('TC-EFF-EDGE-03: checkEscalationStatus triggers when user rated not_helpful and score flatlines/drops', () => {
  const interventionTime = 1000000000;
  const dayMs = 24 * 3600 * 1000;

  const intervention: Intervention = {
    id: 'int-unhelpful',
    project_id: 'p1',
    suggestion_type: 'break_task',
    user_response: 'not_helpful',
    created_at: new Date(interventionTime).toISOString(),
  };

  // Pre: 6, 5
  // Post flat: 5, 5, 5 (postSlope = 0 <= 0)
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 6, created_at: new Date(interventionTime - 2 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 5, created_at: new Date(interventionTime - 1 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 5, created_at: new Date(interventionTime + 1 * dayMs).toISOString() },
    { id: '4', project_id: 'p1', score: 5, created_at: new Date(interventionTime + 2 * dayMs).toISOString() },
    { id: '5', project_id: 'p1', score: 5, created_at: new Date(interventionTime + 3 * dayMs).toISOString() },
  ];

  const res = checkEscalationStatus([intervention], checkins);
  assert.equal(res.escalationRequired, true);
  assert.ok(res.reason?.includes('không hữu ích'));
});

test('TC-EFF-EDGE-04: checkEscalationStatus does NOT trigger when user rated not_helpful BUT postSlope is positive', () => {
  const interventionTime = 1000000000;
  const dayMs = 24 * 3600 * 1000;

  const intervention: Intervention = {
    id: 'int-unhelpful-positive',
    project_id: 'p1',
    suggestion_type: 'break_task',
    user_response: 'not_helpful',
    created_at: new Date(interventionTime).toISOString(),
  };

  // Pre: 5, 4 (slope -1)
  // Post rising: 5, 7, 9 (postSlope +2 > 0)
  const checkins: Checkin[] = [
    { id: '1', project_id: 'p1', score: 5, created_at: new Date(interventionTime - 2 * dayMs).toISOString() },
    { id: '2', project_id: 'p1', score: 4, created_at: new Date(interventionTime - 1 * dayMs).toISOString() },
    { id: '3', project_id: 'p1', score: 5, created_at: new Date(interventionTime + 1 * dayMs).toISOString() },
    { id: '4', project_id: 'p1', score: 7, created_at: new Date(interventionTime + 2 * dayMs).toISOString() },
    { id: '5', project_id: 'p1', score: 9, created_at: new Date(interventionTime + 3 * dayMs).toISOString() },
  ];

  const res = checkEscalationStatus([intervention], checkins);
  assert.equal(res.escalationRequired, false, 'Should not escalate if metrics are actively rebounding');
});

test('TC-EFF-EDGE-05: checkEscalationStatus safe return with empty inputs', () => {
  assert.equal(checkEscalationStatus([], []).escalationRequired, false);
  const singleCheckin: Checkin[] = [{ id: '1', project_id: 'p1', score: 5, created_at: new Date().toISOString() }];
  assert.equal(checkEscalationStatus([], singleCheckin).escalationRequired, false);
});
