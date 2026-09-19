import test from 'node:test';
import assert from 'node:assert/strict';
import { selectOptimalTemplate } from '../lib/interventions/selector';
import { Intervention } from '../lib/supabase/types';
import { getTemplatesByType } from '../lib/interventions/templates';

test('TC-SEL-ADV-01: Throws clear error for non-existent suggestion type', () => {
  assert.throws(
    () => {
      selectOptimalTemplate({
        suggestionType: 'invalid_category_xyz' as any,
      });
    },
    {
      message: /Không tìm thấy template nào cho loại gợi ý/,
    }
  );
});

test('TC-SEL-ADV-02: Handles history containing null or undefined template_ids safely', () => {
  const historyWithNulls: Intervention[] = [
    {
      id: 'int-null-1',
      project_id: 'p-test',
      suggestion_type: 'take_break',
      template_id: undefined,
      tone: null,
      message: 'old message without template ID',
      created_at: new Date().toISOString(),
    },
    {
      id: 'int-null-2',
      project_id: 'p-test',
      suggestion_type: 'take_break',
      template_id: null as any,
      tone: 'compassionate',
      message: 'another old message',
      created_at: new Date().toISOString(),
    },
  ];

  const selected = selectOptimalTemplate({
    suggestionType: 'take_break',
    recentInterventions: historyWithNulls,
  });

  assert.ok(selected && selected.id, 'Must select a valid template without error');
});

test('TC-SEL-ADV-03: Pool exhaustion fallback avoids most recent template ID', () => {
  const takeBreakPool = getTemplatesByType('take_break');
  // Construct a history containing all templates from the pool
  const historyCoveringAll: Intervention[] = takeBreakPool.map((t, idx) => ({
    id: `int-exhaust-${idx}`,
    project_id: 'p-test',
    suggestion_type: 'take_break',
    template_id: t.id,
    tone: t.tone,
    message: 'test',
    created_at: new Date(Date.now() - idx * 24 * 3600 * 1000).toISOString(),
  }));

  const mostRecentId = historyCoveringAll[0].template_id;

  // Since all templates are in history, the selector should avoid at least the most recent one
  for (let i = 0; i < 20; i++) {
    const selected = selectOptimalTemplate({
      suggestionType: 'take_break',
      recentInterventions: historyCoveringAll,
    });
    assert.notEqual(
      selected.id,
      mostRecentId,
      `Exhaustion fallback must avoid the most recent template ID "${mostRecentId}"`
    );
  }
});

test('TC-SEL-ADV-04: Preferred tone bonus (x1.4) significantly increases selection probability', () => {
  let scientificCount = 0;
  const iterations = 50;

  for (let i = 0; i < iterations; i++) {
    const selected = selectOptimalTemplate({
      suggestionType: 'change_approach',
      preferredTone: 'scientific',
    });
    if (selected.tone === 'scientific') scientificCount++;
  }

  // Scientific templates should win a significant portion of iterations
  assert.ok(
    scientificCount >= 15,
    `Expected scientific tone to be favored with preferredTone (got ${scientificCount}/${iterations})`
  );
});

test('TC-SEL-ADV-05: High Energy context (Energy >= 7) favors high_energy templates', () => {
  let highEnergyCount = 0;
  const iterations = 30;

  for (let i = 0; i < iterations; i++) {
    const selected = selectOptimalTemplate({
      suggestionType: 'break_task',
      recentAverageEnergy: 8.5,
    });
    if (selected.energyContext === 'high_energy' || selected.energyContext === 'any') {
      highEnergyCount++;
    }
  }

  assert.ok(
    highEnergyCount >= 25,
    `High energy context should favor high_energy or any templates (got ${highEnergyCount}/${iterations})`
  );
});
