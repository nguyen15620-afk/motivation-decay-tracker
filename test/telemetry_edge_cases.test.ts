import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTemplateTelemetry } from '../lib/interventions/analytics/telemetry';
import { Intervention } from '../lib/supabase/types';

test('TC-TEL-EDGE-01: Groups missing template_ids under "unassigned" without throwing', () => {
  const interventions: Intervention[] = [
    {
      id: 'inv-unassigned-1',
      project_id: 'p1',
      suggestion_type: 'take_break',
      template_id: undefined,
      user_response: 'helpful',
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv-unassigned-2',
      project_id: 'p1',
      suggestion_type: 'take_break',
      template_id: null as any,
      user_response: 'not_helpful',
      created_at: new Date().toISOString(),
    },
  ];

  const report = computeTemplateTelemetry(interventions);
  assert.equal(report.totalInterventions, 2);
  assert.equal(report.totalFeedbackRecorded, 2);
  assert.equal(report.overallAcceptanceRate, 50.0);
  assert.ok(report.byTemplate['unassigned']);
  assert.equal(report.byTemplate['unassigned'].impressions, 2);
  assert.equal(report.byTemplate['unassigned'].helpfulCount, 1);
});

test('TC-TEL-EDGE-02: Underperforming threshold boundaries (>= 3 impressions and < 30% acceptance)', () => {
  const interventions: Intervention[] = [
    // Template A: 2 impressions, 0 helpful -> Not flagged because impressions < 3
    { id: '1', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-a', user_response: 'not_helpful', created_at: new Date().toISOString() },
    { id: '2', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-a', user_response: 'not_helpful', created_at: new Date().toISOString() },

    // Template B: 3 impressions, 0 helpful (0% < 30%) -> FLAGGED!
    { id: '3', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-b', user_response: 'not_helpful', created_at: new Date().toISOString() },
    { id: '4', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-b', user_response: 'dismissed', created_at: new Date().toISOString() },
    { id: '5', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-b', user_response: 'not_helpful', created_at: new Date().toISOString() },

    // Template C: 3 impressions, 1 helpful (33.3% >= 30%) -> NOT flagged
    { id: '6', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-c', user_response: 'helpful', created_at: new Date().toISOString() },
    { id: '7', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-c', user_response: 'not_helpful', created_at: new Date().toISOString() },
    { id: '8', project_id: 'p1', suggestion_type: 'break_task', template_id: 'temp-c', user_response: 'dismissed', created_at: new Date().toISOString() },
  ];

  const report = computeTemplateTelemetry(interventions);
  assert.deepEqual(report.underperformingTemplates, ['temp-b']);
});

test('TC-TEL-EDGE-03: Empty interventions list returns safe zero defaults', () => {
  const report = computeTemplateTelemetry([]);
  assert.equal(report.totalInterventions, 0);
  assert.equal(report.totalFeedbackRecorded, 0);
  assert.equal(report.overallAcceptanceRate, 0);
  assert.deepEqual(report.underperformingTemplates, []);
});
