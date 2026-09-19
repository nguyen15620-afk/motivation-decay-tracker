/**
 * Template Registry & Accessor
 * 
 * Aggregates all psychological coaching template pools into a unified catalog.
 */

import { SuggestionType } from '../../supabase/types';
import { InterventionTemplate } from './types';
import { TAKE_BREAK_TEMPLATES } from './take_break';
import { BREAK_TASK_TEMPLATES } from './break_task';
import { CHANGE_APPROACH_TEMPLATES } from './change_approach';
import { CELEBRATE_PROGRESS_TEMPLATES } from './celebrate_progress';

export * from './types';
export { TAKE_BREAK_TEMPLATES } from './take_break';
export { BREAK_TASK_TEMPLATES } from './break_task';
export { CHANGE_APPROACH_TEMPLATES } from './change_approach';
export { CELEBRATE_PROGRESS_TEMPLATES } from './celebrate_progress';

export const ALL_INTERVENTION_TEMPLATES: InterventionTemplate[] = [
  ...TAKE_BREAK_TEMPLATES,
  ...BREAK_TASK_TEMPLATES,
  ...CHANGE_APPROACH_TEMPLATES,
  ...CELEBRATE_PROGRESS_TEMPLATES,
];

/**
 * Returns all templates belonging to a specific SuggestionType.
 */
export function getTemplatesByType(type: SuggestionType): InterventionTemplate[] {
  switch (type) {
    case 'take_break':
      return TAKE_BREAK_TEMPLATES;
    case 'break_task':
      return BREAK_TASK_TEMPLATES;
    case 'change_approach':
      return CHANGE_APPROACH_TEMPLATES;
    case 'celebrate_progress':
      return CELEBRATE_PROGRESS_TEMPLATES;
    default:
      return [];
  }
}
