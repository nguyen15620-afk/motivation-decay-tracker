/**
 * Motivation Decay Tracker - Adaptive Template Selector
 * 
 * Implements anti-repetition rotation ($Pool \setminus History_{k=3}$),
 * user feedback weight adjustment (helpful vs. not_helpful),
 * and 2D Motivation-Energy alignment.
 */

import { Intervention, SuggestionType } from '../supabase/types';
import { getTemplatesByType, InterventionTemplate, InterventionTone } from './templates';

export interface SelectTemplateOptions {
  suggestionType: SuggestionType;
  recentInterventions?: Intervention[];
  recentAverageEnergy?: number | null;
  preferredTone?: InterventionTone;
}

export function selectOptimalTemplate({
  suggestionType,
  recentInterventions = [],
  recentAverageEnergy,
  preferredTone,
}: SelectTemplateOptions): InterventionTemplate {
  const pool = getTemplatesByType(suggestionType);
  if (pool.length === 0) {
    throw new Error(`Không tìm thấy template nào cho loại gợi ý: ${suggestionType}`);
  }

  // 1. Anti-Repetition Window (k = 3): Extract template IDs from last 3 interventions
  const last3Interventions = recentInterventions.slice(0, 3);
  const recentTemplateIds = new Set(
    last3Interventions
      .map((i) => i.template_id)
      .filter((id): id is string => Boolean(id))
  );

  // Filter out recently used templates (Pool \ History)
  let candidates = pool.filter((t) => !recentTemplateIds.has(t.id));

  // If all templates have been exhausted by history, avoid at least the most recent one
  if (candidates.length === 0) {
    const mostRecentId = last3Interventions[0]?.template_id;
    candidates = pool.filter((t) => t.id !== mostRecentId);
    if (candidates.length === 0) {
      candidates = [...pool];
    }
  }

  // 2. Compute feedback weights based on user response history
  const toneWeights: Record<InterventionTone, number> = {
    compassionate: 1.0,
    action_oriented: 1.0,
    scientific: 1.0,
  };

  const penalizedTemplateIds = new Set<string>();

  for (const item of recentInterventions) {
    if (item.tone && toneWeights[item.tone] !== undefined) {
      if (item.user_response === 'helpful') {
        toneWeights[item.tone] *= 2.0;
      } else if (item.user_response === 'not_helpful' || item.user_response === 'dismissed') {
        toneWeights[item.tone] *= 0.2;
      }
    }

    if ((item.user_response === 'not_helpful' || item.user_response === 'dismissed') && item.template_id) {
      penalizedTemplateIds.add(item.template_id);
    }
  }

  // 3. Weight calculation per candidate
  const weightedCandidates = candidates.map((template) => {
    let weight = 1.0;

    // Apply tone weight from feedback history
    weight *= toneWeights[template.tone] || 1.0;

    // Apply preferredTone bonus if specified
    if (preferredTone && template.tone === preferredTone) {
      weight *= 1.4;
    }

    // Energy context alignment
    if (recentAverageEnergy !== undefined && recentAverageEnergy !== null) {
      if (recentAverageEnergy <= 4) {
        if (template.energyContext === 'low_energy') weight *= 2.0;
        else if (template.energyContext === 'high_energy') weight *= 0.3;
      } else if (recentAverageEnergy >= 7) {
        if (template.energyContext === 'high_energy') weight *= 2.0;
        else if (template.energyContext === 'low_energy') weight *= 0.4;
      }
    }

    // Penalize individual templates that were explicitly marked not helpful
    if (penalizedTemplateIds.has(template.id)) {
      weight *= 0.1;
    }

    return {
      template,
      weight: Math.max(0.01, weight),
    };
  });

  // 4. Select candidate via roulette-wheel (weighted random)
  const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
  let randomVal = Math.random() * totalWeight;

  for (const item of weightedCandidates) {
    randomVal -= item.weight;
    if (randomVal <= 0) {
      return item.template;
    }
  }

  // Fallback to first candidate
  return weightedCandidates[0].template;
}
