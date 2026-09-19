/**
 * Motivation Decay Tracker - Intervention Telemetry & Acceptance Analytics
 * 
 * Aggregates acceptance rates and user feedback across templates, tones,
 * and categories to power A/B testing and continuous template refinement.
 */

import {
  Intervention,
  TemplateTelemetryMetric,
  SuggestionType,
  InterventionTone,
} from '../../supabase/types';

export interface TelemetryReport {
  totalInterventions: number;
  totalFeedbackRecorded: number;
  overallAcceptanceRate: number; // 0 - 100%
  byTemplate: Record<string, TemplateTelemetryMetric>;
  byTone: Record<InterventionTone, { impressions: number; helpful: number; rate: number }>;
  byCategory: Record<SuggestionType, { impressions: number; helpful: number; rate: number }>;
  underperformingTemplates: string[]; // Templates with >= 3 impressions and < 30% acceptance
}

/**
 * Computes telemetry metrics from an array of interventions
 */
export function computeTemplateTelemetry(interventions: Intervention[]): TelemetryReport {
  const byTemplate: Record<string, TemplateTelemetryMetric> = {};
  const byTone: Record<InterventionTone, { impressions: number; helpful: number; rate: number }> = {
    compassionate: { impressions: 0, helpful: 0, rate: 0 },
    action_oriented: { impressions: 0, helpful: 0, rate: 0 },
    scientific: { impressions: 0, helpful: 0, rate: 0 },
  };
  const byCategory: Record<SuggestionType, { impressions: number; helpful: number; rate: number }> = {
    take_break: { impressions: 0, helpful: 0, rate: 0 },
    break_task: { impressions: 0, helpful: 0, rate: 0 },
    change_approach: { impressions: 0, helpful: 0, rate: 0 },
    celebrate_progress: { impressions: 0, helpful: 0, rate: 0 },
  };

  let totalFeedback = 0;
  let totalHelpful = 0;

  for (const inv of interventions) {
    const tId = inv.template_id || 'unassigned';
    const tone: InterventionTone = inv.tone || 'compassionate';
    const cat: SuggestionType = inv.suggestion_type;

    if (!byTemplate[tId]) {
      byTemplate[tId] = {
        templateId: tId,
        suggestionType: cat,
        tone,
        impressions: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        dismissedCount: 0,
        acceptanceRate: 0,
        feedbackCount: 0,
      };
    }

    byTemplate[tId].impressions += 1;
    if (byTone[tone]) byTone[tone].impressions += 1;
    if (byCategory[cat]) byCategory[cat].impressions += 1;

    if (inv.user_response) {
      totalFeedback += 1;
      byTemplate[tId].feedbackCount += 1;

      if (inv.user_response === 'helpful') {
        totalHelpful += 1;
        byTemplate[tId].helpfulCount += 1;
        if (byTone[tone]) byTone[tone].helpful += 1;
        if (byCategory[cat]) byCategory[cat].helpful += 1;
      } else if (inv.user_response === 'not_helpful') {
        byTemplate[tId].notHelpfulCount += 1;
      } else if (inv.user_response === 'dismissed') {
        byTemplate[tId].dismissedCount += 1;
      }
    }
  }

  // Calculate percentage rates
  for (const tId of Object.keys(byTemplate)) {
    const item = byTemplate[tId];
    item.acceptanceRate = item.impressions > 0
      ? Number(((item.helpfulCount / item.impressions) * 100).toFixed(1))
      : 0;
  }

  for (const key of Object.keys(byTone) as InterventionTone[]) {
    const t = byTone[key];
    t.rate = t.impressions > 0 ? Number(((t.helpful / t.impressions) * 100).toFixed(1)) : 0;
  }

  for (const key of Object.keys(byCategory) as SuggestionType[]) {
    const c = byCategory[key];
    c.rate = c.impressions > 0 ? Number(((c.helpful / c.impressions) * 100).toFixed(1)) : 0;
  }

  const overallAcceptanceRate = interventions.length > 0
    ? Number(((totalHelpful / interventions.length) * 100).toFixed(1))
    : 0;

  // Identify underperforming templates for A/B testing prune
  const underperformingTemplates = Object.values(byTemplate)
    .filter((item) => item.impressions >= 3 && item.acceptanceRate < 30)
    .map((item) => item.templateId);

  return {
    totalInterventions: interventions.length,
    totalFeedbackRecorded: totalFeedback,
    overallAcceptanceRate,
    byTemplate,
    byTone,
    byCategory,
    underperformingTemplates,
  };
}
