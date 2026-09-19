/**
 * Motivation Decay Tracker - Adaptive Intervention Orchestrator
 * 
 * Coordinates the 2D Motivation-Energy Matrix, anti-repetition template pool selection,
 * and optional AI empathy synthesis with instant fallback.
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
import { synthesizeAIIntervention } from './ai/synthesizer';
import { evaluateEarlyPhaseWarmup } from './onboarding/warmup';
import { checkEscalationStatus } from './analytics/efficacy';

export interface AdaptiveInterventionParams {
  projectId: string;
  projectName: string;
  trendAnalysis: TrendAnalysisResult;
  lastIntervention?: Intervention | null;
  recentInterventions?: Intervention[];
  latestContextNote?: string | null;
  recentContextNotes?: string[];
  recentAverageEnergy?: number | null;
  enableAI?: boolean;
  checkins?: Checkin[];
  userProvidedApiKey?: string | null;
}



export interface AdaptiveInterventionResult {
  shouldIntervene: boolean;
  reason?: string;
  suggestionType?: SuggestionType;
  message?: string;
  templateId?: string;
  tone?: InterventionTone;
  actionStep?: string;
}

/**
 * Evaluates trend and context using the 2D Motivation x Energy Matrix,
 * applies the anti-repetition template selector, and optionally enhances with AI.
 */
export async function generateAdaptiveIntervention({
  projectId,
  projectName,
  trendAnalysis,
  lastIntervention,
  recentInterventions = [],
  latestContextNote,
  recentContextNotes = [],
  recentAverageEnergy,
  enableAI = true,
  checkins,
  userProvidedApiKey,
}: AdaptiveInterventionParams): Promise<AdaptiveInterventionResult> {
  const { flagType, isSuddenDrop, slope, suddenDropDiff, dataPointCount } = trendAnalysis;

  // Combine full history of interventions
  const fullInterventionHistory = lastIntervention && !recentInterventions.some((i) => i.id === lastIntervention.id)
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

  // 1. Anti-spam / Cooldown verification (7 days)
  const mostRecent = fullInterventionHistory[0] || lastIntervention;
  if (mostRecent) {
    const lastCreated = new Date(mostRecent.created_at).getTime();
    const now = Date.now();
    const daysSinceLast = (now - lastCreated) / (1000 * 60 * 60 * 24);

    // If within cooldown period and not an acute sudden drop, suppress intervention
    if (daysSinceLast < TREND_THRESHOLDS.INTERVENTION_COOLDOWN_DAYS && !isSuddenDrop) {
      return {
        shouldIntervene: false,
        reason: `Đã có can thiệp cách đây ${Math.round(daysSinceLast)} ngày (đang trong thời gian cooldown 7 ngày).`,
      };
    }
  }

  // Combine recent notes
  const allNotes = latestContextNote
    ? [latestContextNote, ...recentContextNotes]
    : recentContextNotes;
  const primaryNote = allNotes[0] || '';
  const noteLower = primaryNote.toLowerCase();

  // Keyword lexicons
  const milestoneKeywords = ['xong', 'hoàn thành', 'milestone', 'done', 'release', 'launch', 'bàn giao'];
  const overwhelmedKeywords = ['nhiều', 'khó', 'ngập', 'ngợp', 'bế tắc', 'chưa xong', 'deadline', 'phức tạp'];

  // 2. 2D Decision Matrix: Motivation Trend x Energy Level
  let targetSuggestionType: SuggestionType;

  if (isSuddenDrop) {
    // Acute Sudden Drop: Highest priority -> take_break
    targetSuggestionType = 'take_break';
  } else if (flagType === 'declining') {
    if (milestoneKeywords.some((kw) => noteLower.includes(kw))) {
      // Milestone completed -> celebrate_progress (Hedonic adaptation)
      targetSuggestionType = 'celebrate_progress';
    } else if (recentAverageEnergy !== undefined && recentAverageEnergy !== null && recentAverageEnergy <= 4) {
      // Declining motivation + Low physical energy -> Biological exhaustion -> take_break
      targetSuggestionType = 'take_break';
    } else if (recentAverageEnergy !== undefined && recentAverageEnergy !== null && recentAverageEnergy >= 7) {
      // Declining motivation + High physical energy -> Cognitive Block / Ambiguity -> break_task
      targetSuggestionType = 'break_task';
    } else if (overwhelmedKeywords.some((kw) => noteLower.includes(kw)) || slope <= -0.2) {
      // Overwhelmed or steep drop -> break_task
      targetSuggestionType = 'break_task';
    } else {
      // Default declining -> break_task
      targetSuggestionType = 'break_task';
    }

    // Escalation Protocol: If previous intervention was ineffective, escalate from break_task to change_approach
    if (checkins && fullInterventionHistory.length > 0) {
      const escalation = checkEscalationStatus(fullInterventionHistory, checkins);
      if (escalation.escalationRequired && targetSuggestionType === 'break_task') {
        targetSuggestionType = 'change_approach';
      }
    }
  } else if (flagType === 'volatile') {
    targetSuggestionType = 'change_approach';
  } else {
    // Stable or Improving -> No intervention needed
    return {
      shouldIntervene: false,
      reason: `Trạng thái dự án đang ${flagType === 'improving' ? 'phát triển tốt' : 'ổn định'}, không cần can thiệp.`,
    };
  }

  // 3. Select optimal template via Anti-Repetition & Feedback-Weighted Selector
  const template = selectOptimalTemplate({
    suggestionType: targetSuggestionType,
    recentInterventions: fullInterventionHistory,
    recentAverageEnergy,
  });

  let message = template.renderMessage(projectName);

  // 4. Optional: Synthesize personalized message with AI if enabled
  if (enableAI) {
    try {
      const aiMessage = await synthesizeAIIntervention({
        projectName,
        slope,
        recentAverageEnergy,
        recentContextNotes: allNotes,
        chosenCategory: targetSuggestionType,
        userProvidedApiKey,
      });

      if (aiMessage) {
        message = aiMessage;
      }
    } catch {
      // Graceful fallback to template message on any error
    }
  }

  return {
    shouldIntervene: true,
    suggestionType: targetSuggestionType,
    message,
    templateId: template.id,
    tone: template.tone,
    actionStep: template.actionStep,
  };
}
