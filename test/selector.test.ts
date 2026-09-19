import test from 'node:test';
import assert from 'node:assert/strict';
import { selectOptimalTemplate } from '../lib/interventions/selector';
import { Intervention } from '../lib/supabase/types';

test('TC-SEL-01: Anti-repetition window (k=3) prevents consecutive duplicate template IDs', () => {
  const chosenIds: string[] = [];
  const fakeHistory: Intervention[] = [];

  // Run 6 consecutive selections simulating 6 weekly/cooldown triggers
  for (let step = 0; step < 6; step++) {
    const selected = selectOptimalTemplate({
      suggestionType: 'break_task',
      recentInterventions: fakeHistory,
    });

    // Check that the selected template is NOT within the last 3 chosen
    const last3 = chosenIds.slice(-3);
    assert.equal(
      last3.includes(selected.id),
      false,
      `Template ID "${selected.id}" was repeated within the 3-item history window: [${last3.join(', ')}]`
    );

    chosenIds.push(selected.id);

    // Push into fake history
    fakeHistory.unshift({
      id: `int-${step}`,
      project_id: 'p-test',
      suggestion_type: 'break_task',
      template_id: selected.id,
      tone: selected.tone,
      message: 'test',
      created_at: new Date(Date.now() - step * 7 * 24 * 3600 * 1000).toISOString(),
    });
  }

  assert.equal(chosenIds.length, 6);
  // Ensure at least 4 unique templates were selected across 6 steps
  const uniqueIds = new Set(chosenIds);
  assert.ok(uniqueIds.size >= 4, `Expected at least 4 unique templates, got ${uniqueIds.size}`);
});

test('TC-SEL-02: User feedback weighting deprioritizes not_helpful tones and penalizes bad templates', () => {
  const penalizedTemplateId = 'bt_act_micro_15m_01';

  // Create history where user repeatedly marked action_oriented / penalizedTemplateId as not_helpful
  const history: Intervention[] = [
    {
      id: 'int-neg-1',
      project_id: 'p-test',
      suggestion_type: 'break_task',
      template_id: penalizedTemplateId,
      tone: 'action_oriented',
      message: 'test',
      user_response: 'not_helpful',
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'int-pos-1',
      project_id: 'p-test',
      suggestion_type: 'break_task',
      template_id: 'bt_comp_friction_02',
      tone: 'compassionate',
      message: 'test',
      user_response: 'helpful',
      created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  // Run 50 picks to test statistical preference
  let compassionateCount = 0;
  let penalizedPicks = 0;

  for (let i = 0; i < 50; i++) {
    const selected = selectOptimalTemplate({
      suggestionType: 'break_task',
      recentInterventions: history,
    });

    if (selected.tone === 'compassionate') compassionateCount++;
    if (selected.id === penalizedTemplateId) penalizedPicks++;
  }

  // Compassionate should be preferred over heavily penalized action_oriented
  assert.ok(
    compassionateCount > penalizedPicks,
    `Expected compassionate tone (${compassionateCount}) to exceed penalized picks (${penalizedPicks})`
  );
  assert.ok(
    compassionateCount >= 10,
    `Expected compassionate tone to be favored due to helpful feedback (got ${compassionateCount}/50)`
  );
  assert.ok(
    penalizedPicks <= 6,
    `Expected not_helpful template to be heavily suppressed (got ${penalizedPicks}/50)`
  );
});

test('TC-SEL-03: Energy context aligns template selection with low vs high physical capacity', () => {
  // Low energy should favor templates tailored for exhaustion
  const lowEnergyPicks = Array.from({ length: 15 }, () =>
    selectOptimalTemplate({
      suggestionType: 'take_break',
      recentAverageEnergy: 2.5,
    })
  );

  const lowEnergyCount = lowEnergyPicks.filter(
    (t) => t.energyContext === 'low_energy' || t.energyContext === 'any'
  ).length;

  assert.equal(
    lowEnergyCount,
    15,
    'All picks for low energy should match low_energy or any context'
  );
});
