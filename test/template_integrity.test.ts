import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_INTERVENTION_TEMPLATES,
  getTemplatesByType,
  InterventionTone,
  EnergyContext,
} from '../lib/interventions/templates';
import { SuggestionType } from '../lib/supabase/types';

test('TC-TMP-01: Template Catalog - Total count and distribution across all 4 categories', () => {
  assert.ok(
    ALL_INTERVENTION_TEMPLATES.length >= 32,
    `Expected at least 32 templates in the pool, found ${ALL_INTERVENTION_TEMPLATES.length}`
  );

  const categories: SuggestionType[] = [
    'take_break',
    'break_task',
    'change_approach',
    'celebrate_progress',
  ];

  for (const cat of categories) {
    const pool = getTemplatesByType(cat);
    assert.ok(
      pool.length >= 8,
      `Category "${cat}" must have at least 8 templates, found ${pool.length}`
    );
  }
});

test('TC-TMP-02: Template Catalog - All template IDs must be globally unique', () => {
  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (const template of ALL_INTERVENTION_TEMPLATES) {
    if (seenIds.has(template.id)) {
      duplicateIds.push(template.id);
    }
    seenIds.add(template.id);
  }

  assert.equal(
    duplicateIds.length,
    0,
    `Duplicate template IDs detected: ${duplicateIds.join(', ')}`
  );
});

test('TC-TMP-03: Template Catalog - Structural 3-part validity (Validation + Insight + ActionStep)', () => {
  for (const t of ALL_INTERVENTION_TEMPLATES) {
    assert.ok(t.id && typeof t.id === 'string', `Template ${t.id} must have a valid string ID`);
    assert.ok(
      t.validation && t.validation.trim().length >= 10,
      `Template ${t.id} must have a meaningful Validation part (>= 10 chars)`
    );
    assert.ok(
      t.insight && t.insight.trim().length >= 10,
      `Template ${t.id} must have a meaningful Psychological Insight part (>= 10 chars)`
    );
    assert.ok(
      t.actionStep && t.actionStep.trim().length >= 10,
      `Template ${t.id} must have an Actionable Micro-step part (>= 10 chars)`
    );
  }
});

test('TC-TMP-04: Template Catalog - renderMessage properly embeds project name and formats output', () => {
  const testProject = 'Revit Automated MEP Pipeline';

  for (const t of ALL_INTERVENTION_TEMPLATES) {
    assert.equal(typeof t.renderMessage, 'function', `Template ${t.id} must have renderMessage function`);
    const rendered = t.renderMessage(testProject);
    assert.ok(
      typeof rendered === 'string' && rendered.length >= 30,
      `Rendered message for ${t.id} must be a non-empty string`
    );
    assert.ok(
      rendered.includes(testProject),
      `Template ${t.id} must embed the target project name "${testProject}"`
    );
  }
});

test('TC-TMP-05: Template Catalog - Valid Tone and EnergyContext enums', () => {
  const validTones: InterventionTone[] = ['compassionate', 'action_oriented', 'scientific'];
  const validEnergyContexts: EnergyContext[] = ['low_energy', 'high_energy', 'any'];

  for (const t of ALL_INTERVENTION_TEMPLATES) {
    assert.ok(
      validTones.includes(t.tone),
      `Template ${t.id} has invalid tone "${t.tone}"`
    );
    assert.ok(
      validEnergyContexts.includes(t.energyContext),
      `Template ${t.id} has invalid energyContext "${t.energyContext}"`
    );
  }
});
