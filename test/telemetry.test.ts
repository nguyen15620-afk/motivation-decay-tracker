/**
 * Test Suite: Intervention Telemetry & Acceptance Analytics
 * 
 * Tests aggregation of user feedback, acceptance rate calculation,
 * and detection of underperforming templates.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeTemplateTelemetry } from '../lib/interventions/analytics/telemetry';
import { Intervention } from '../lib/supabase/types';

describe('Intervention Telemetry & Acceptance Analytics', () => {
  it('TC-TEL-01: Correctly aggregates impressions, helpful ratings, and overall acceptance rate', () => {
    const interventions: Intervention[] = [
      {
        id: '1',
        project_id: 'p1',
        suggestion_type: 'break_task',
        template_id: 'break_task_kaizen_friction',
        tone: 'action_oriented',
        message: 'Msg 1',
        user_response: 'helpful',
        created_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '2',
        project_id: 'p1',
        suggestion_type: 'break_task',
        template_id: 'break_task_kaizen_friction',
        tone: 'action_oriented',
        message: 'Msg 2',
        user_response: 'helpful',
        created_at: '2026-09-08T00:00:00Z',
      },
      {
        id: '3',
        project_id: 'p1',
        suggestion_type: 'break_task',
        template_id: 'break_task_kaizen_friction',
        tone: 'action_oriented',
        message: 'Msg 3',
        user_response: 'not_helpful',
        created_at: '2026-09-15T00:00:00Z',
      },
      {
        id: '4',
        project_id: 'p2',
        suggestion_type: 'take_break',
        template_id: 'take_break_biological_recharge',
        tone: 'compassionate',
        message: 'Msg 4',
        user_response: 'dismissed',
        created_at: '2026-09-10T00:00:00Z',
      },
    ];

    const report = computeTemplateTelemetry(interventions);

    assert.strictEqual(report.totalInterventions, 4);
    assert.strictEqual(report.totalFeedbackRecorded, 4);
    // 2 helpful out of 4 total interventions = 50.0%
    assert.strictEqual(report.overallAcceptanceRate, 50.0);

    // Check specific template metric
    const kaizenMetric = report.byTemplate['break_task_kaizen_friction'];
    assert.strictEqual(kaizenMetric.impressions, 3);
    assert.strictEqual(kaizenMetric.helpfulCount, 2);
    assert.strictEqual(kaizenMetric.notHelpfulCount, 1);
    assert.strictEqual(kaizenMetric.acceptanceRate, 66.7);

    // Check tone metrics
    assert.strictEqual(report.byTone.action_oriented.helpful, 2);
    assert.strictEqual(report.byTone.compassionate.helpful, 0);
  });

  it('TC-TEL-02: Flags underperforming templates with >= 3 impressions and < 30% acceptance', () => {
    const interventions: Intervention[] = [
      {
        id: '1',
        project_id: 'p1',
        suggestion_type: 'change_approach',
        template_id: 'poor_template_01',
        tone: 'scientific',
        message: 'M',
        user_response: 'not_helpful',
        created_at: '2026-09-01T00:00:00Z',
      },
      {
        id: '2',
        project_id: 'p1',
        suggestion_type: 'change_approach',
        template_id: 'poor_template_01',
        tone: 'scientific',
        message: 'M',
        user_response: 'not_helpful',
        created_at: '2026-09-02T00:00:00Z',
      },
      {
        id: '3',
        project_id: 'p1',
        suggestion_type: 'change_approach',
        template_id: 'poor_template_01',
        tone: 'scientific',
        message: 'M',
        user_response: 'dismissed',
        created_at: '2026-09-03T00:00:00Z',
      },
    ];

    const report = computeTemplateTelemetry(interventions);
    assert.ok(report.underperformingTemplates.includes('poor_template_01'));
  });
});
