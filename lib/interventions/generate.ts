/**
 * Motivation Decay Tracker - Smart Interventions Generator
 * 
 * Adaptive intervention engine integrating the 2D Motivation x Energy Matrix,
 * anti-repetition template pool rotation, and user feedback weighting.
 */

import { TREND_THRESHOLDS } from '../trend/thresholds';
import {
  Checkin,
  Intervention,
  SuggestionType,
  TrendAnalysisResult,
  InterventionTone,
} from '../supabase/types';
import { selectOptimalTemplate } from './selector';
import { generateAdaptiveIntervention } from './engine';
import { evaluateEarlyPhaseWarmup } from './onboarding/warmup';
import { checkEscalationStatus } from './analytics/efficacy';

export interface GenerateInterventionParams {
  projectId: string;
  projectName: string;
  trendAnalysis: TrendAnalysisResult;
  lastIntervention?: Intervention | null;
  recentInterventions?: Intervention[];
  latestContextNote?: string | null;
  recentContextNotes?: string[];
  recentAverageEnergy?: number | null;
  preferredTone?: InterventionTone;
  checkins?: Checkin[];
  userProvidedApiKey?: string | null;
}



export interface InterventionCandidate {
  shouldIntervene: boolean;
  reason?: string;
  suggestionType?: SuggestionType;
  message?: string;
  templateId?: string;
  tone?: InterventionTone;
  actionStep?: string;
}

/**
 * Synchronous entry point: Evaluates trend, context, and energy metrics to select
 * an optimal, non-repetitive intervention template from the psychological pool.
 */
export function evaluateAndGenerateIntervention({
  projectId,
  projectName,
  trendAnalysis,
  lastIntervention,
  recentInterventions = [],
  latestContextNote,
  recentContextNotes = [],
  recentAverageEnergy,
  preferredTone,
  checkins,
}: GenerateInterventionParams): InterventionCandidate {
  const { flagType, isSuddenDrop, slope, suddenDropDiff, dataPointCount } = trendAnalysis;

  // Aggregate past interventions for history tracking
  const fullHistory = lastIntervention && !recentInterventions.some((i) => i.id === lastIntervention.id)
    ? [lastIntervention, ...recentInterventions]
    : recentInterventions;

  // Early-Phase Warmup: Check for early friction when < 5 check-ins exist (Cold-Start Gap)
  if (dataPointCount < 5 && checkins && checkins.length > 0 && !isSuddenDrop) {
    const warmup = evaluateEarlyPhaseWarmup({ projectName, checkins });
    if (warmup.shouldIntervene) {
      return {
        shouldIntervene: true,
        suggestionType: warmup.suggestionType,
        message: warmup.message,
        templateId: warmup.templateId,
        tone: warmup.tone,
        actionStep: warmup.actionStep,
        reason: 'Kích hoạt chỉ dẫn tạo đà khởi động giai đoạn đầu (Early-Phase Warmup).',
      };
    }
  }

  const mostRecent = fullHistory[0] || lastIntervention;

  // 1. Anti-spam / Cooldown verification (7 days)
  if (mostRecent) {
    const lastCreated = new Date(mostRecent.created_at).getTime();
    const now = Date.now();
    const daysSinceLast = (now - lastCreated) / (1000 * 60 * 60 * 24);

    // If within cooldown period and user hasn't experienced an acute sudden drop, do not spam
    if (daysSinceLast < TREND_THRESHOLDS.INTERVENTION_COOLDOWN_DAYS && !isSuddenDrop) {
      return {
        shouldIntervene: false,
        reason: `Đã có can thiệp cách đây ${Math.round(daysSinceLast)} ngày (đang trong thời gian cooldown 7 ngày).`,
      };
    }
  }

  // Aggregate context notes
  const allNotes = latestContextNote
    ? [latestContextNote, ...recentContextNotes]
    : recentContextNotes;
  const primaryNote = allNotes[0] || '';
  const noteLower = primaryNote.toLowerCase();

  const milestoneKeywords = ['xong', 'hoàn thành', 'milestone', 'done', 'release', 'launch', 'bàn giao'];
  const overwhelmedKeywords = ['nhiều', 'khó', 'ngập', 'ngợp', 'bế tắc', 'chưa xong', 'deadline', 'phức tạp'];

  // Energy resolution (priority: parameter > trendAnalysis.recentAverageEnergy)
  const resolvedEnergy = recentAverageEnergy ?? trendAnalysis.recentAverageEnergy ?? null;

  // 2. 2D Motivation x Energy Decision Matrix
  let targetSuggestionType: SuggestionType;

  if (isSuddenDrop) {
    // Acute Sudden Drop -> take_break (Highest priority)
    targetSuggestionType = 'take_break';
  } else if (flagType === 'declining') {
    if (milestoneKeywords.some((kw) => noteLower.includes(kw))) {
      // Hedonic Adaptation post-milestone -> celebrate_progress
      targetSuggestionType = 'celebrate_progress';
    } else if (resolvedEnergy !== null && resolvedEnergy <= 4) {
      // Physical Exhaustion (Low Energy) -> take_break
      targetSuggestionType = 'take_break';
    } else if (resolvedEnergy !== null && resolvedEnergy >= 7) {
      // Cognitive Blocker (High Energy) -> break_task
      targetSuggestionType = 'break_task';
    } else if (overwhelmedKeywords.some((kw) => noteLower.includes(kw)) || slope <= -0.2) {
      targetSuggestionType = 'break_task';
    } else {
      targetSuggestionType = 'break_task';
    }

    // Escalation Protocol: If previous intervention was ineffective, escalate from break_task to change_approach
    if (checkins && fullHistory.length > 0) {
      const escalation = checkEscalationStatus(fullHistory, checkins);
      if (escalation.escalationRequired && targetSuggestionType === 'break_task') {
        targetSuggestionType = 'change_approach';
      }
    }
  } else if (flagType === 'volatile') {
    targetSuggestionType = 'change_approach';
  } else {
    // Stable or Improving
    return {
      shouldIntervene: false,
      reason: `Trạng thái dự án đang ${flagType === 'improving' ? 'phát triển tốt' : 'ổn định'}, không cần can thiệp.`,
    };
  }

  // 3. Select optimal template with anti-repetition rotation ($Pool \setminus History_{k=3}$)
  const selectedTemplate = selectOptimalTemplate({
    suggestionType: targetSuggestionType,
    recentInterventions: fullHistory,
    recentAverageEnergy: resolvedEnergy,
    preferredTone,
  });

  return {
    shouldIntervene: true,
    suggestionType: targetSuggestionType,
    message: selectedTemplate.renderMessage(projectName),
    templateId: selectedTemplate.id,
    tone: selectedTemplate.tone,
    actionStep: selectedTemplate.actionStep,
  };
}

/**
 * Asynchronous entry point with optional AI Empathy Synthesizer.
 */
export async function evaluateAndGenerateInterventionAsync(
  params: GenerateInterventionParams & { enableAI?: boolean }
): Promise<InterventionCandidate> {
  return generateAdaptiveIntervention(params);
}
