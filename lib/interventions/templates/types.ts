/**
 * Motivation Decay Tracker - Intervention Template Engine Types
 * 
 * Defines structural types for psychological coaching templates,
 * empathy tones, energy matrix dimensions, and 3-part message components.
 */

import { SuggestionType } from '../../supabase/types';

export type InterventionTone = 'compassionate' | 'action_oriented' | 'scientific';

export type EnergyContext = 'low_energy' | 'high_energy' | 'any';

export interface InterventionTemplate {
  id: string;
  suggestionType: SuggestionType;
  tone: InterventionTone;
  energyContext: EnergyContext;
  
  /**
   * Part 1: Validation - Thừa nhận và bình thường hóa cảm xúc mà không phán xét
   */
  validation: string;

  /**
   * Part 2: Psychological Insight - Giải thích cơ chế sinh học / tâm lý học hành vi
   */
  insight: string;

  /**
   * Part 3: Actionable Micro-step - Một hành động cụ thể tốn dưới 5-10 phút
   */
  actionStep: string;

  /**
   * Helper function to render a unified, empathetic message customized for the project
   */
  renderMessage: (projectName: string) => string;

  tags?: string[];
}
