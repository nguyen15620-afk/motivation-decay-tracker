/**
 * Motivation Decay Tracker - Intervention Efficacy Analyzer
 * 
 * Measures real-world behavioral recovery following an intervention:
 * Recovery Delta: Δ_recovery = Slope_post - Slope_pre
 * 
 * If an intervention fails to reverse or stabilize decaying scores (Δ <= 0),
 * the system marks it as ineffective and triggers the Escalation Protocol.
 */

import { Checkin, Intervention, EfficacyEvaluation, EfficacyStatus } from '../../supabase/types';
import { calculateLinearRegression } from '../../trend/regression';

export interface EvaluateEfficacyParams {
  intervention: Intervention;
  checkins: Checkin[];
  minPostCheckins?: number; // Default 3 check-ins for statistical trend
}

/**
 * Calculates pre-intervention slope, post-intervention slope, and the Recovery Delta.
 */
export function evaluateInterventionEfficacy({
  intervention,
  checkins,
  minPostCheckins = 3,
}: EvaluateEfficacyParams): EfficacyEvaluation {
  const interventionTime = new Date(intervention.created_at).getTime();

  // Partition check-ins into pre and post
  const preCheckins = checkins
    .filter((c) => new Date(c.created_at).getTime() <= interventionTime)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const postCheckins = checkins
    .filter((c) => new Date(c.created_at).getTime() > interventionTime)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // If insufficient post data to evaluate, return early
  if (postCheckins.length < minPostCheckins || preCheckins.length < 2) {
    return {
      interventionId: intervention.id,
      projectId: intervention.project_id,
      preSlope: 0,
      postSlope: 0,
      recoveryDelta: 0,
      status: 'insufficient_data',
      isEffective: false,
      preCheckinCount: preCheckins.length,
      postCheckinCount: postCheckins.length,
      evaluatedAt: new Date().toISOString(),
      escalationRecommended: false,
    };
  }

  // Convert pre-checkins to relative days
  const preStart = new Date(preCheckins[0].created_at).getTime();
  const prePoints = preCheckins.map((c) => ({
    x: (new Date(c.created_at).getTime() - preStart) / (1000 * 60 * 60 * 24),
    y: c.score,
  }));
  const preRegression = calculateLinearRegression(prePoints);
  const preSlope = Number(preRegression.slope.toFixed(4));

  // Convert post-checkins to relative days
  const postPoints = postCheckins.map((c) => ({
    x: (new Date(c.created_at).getTime() - interventionTime) / (1000 * 60 * 60 * 24),
    y: c.score,
  }));
  const postRegression = calculateLinearRegression(postPoints);
  const postSlope = Number(postRegression.slope.toFixed(4));

  // Recovery Delta = Slope_post - Slope_pre
  const recoveryDelta = Number((postSlope - preSlope).toFixed(4));

  let status: EfficacyStatus;
  let isEffective = false;
  let escalationRecommended = false;

  if (recoveryDelta > 0.10) {
    // Statistically meaningful improvement / reversal of decay
    status = 'effective';
    isEffective = true;
    escalationRecommended = false;
  } else if (recoveryDelta >= 0) {
    // Mild stabilization or arrest of decay
    status = 'partial';
    isEffective = false;
    escalationRecommended = false;
  } else {
    // Decay accelerated or continued downwards despite intervention
    status = 'ineffective';
    isEffective = false;
    escalationRecommended = true;
  }

  return {
    interventionId: intervention.id,
    projectId: intervention.project_id,
    preSlope,
    postSlope,
    recoveryDelta,
    status,
    isEffective,
    preCheckinCount: preCheckins.length,
    postCheckinCount: postCheckins.length,
    evaluatedAt: new Date().toISOString(),
    escalationRecommended,
  };
}

/**
 * Checks if an active escalation protocol is required for the next intervention.
 * Escalation is triggered if the latest intervention was ineffective or user dismissed it
 * and scores continue to trend negative.
 */
export function checkEscalationStatus(
  recentInterventions: Intervention[],
  checkins: Checkin[]
): {
  escalationRequired: boolean;
  reason?: string;
  previousEvaluation?: EfficacyEvaluation | null;
} {
  if (!recentInterventions.length || checkins.length < 3) {
    return { escalationRequired: false };
  }

  const latestIntervention = recentInterventions[0];
  const evalResult = evaluateInterventionEfficacy({
    intervention: latestIntervention,
    checkins,
  });

  if (evalResult.escalationRecommended) {
    return {
      escalationRequired: true,
      reason: `Can thiệp gần nhất (${latestIntervention.suggestion_type}) không giúp cải thiện điểm số (Recovery Delta = ${evalResult.recoveryDelta}). Cần kích hoạt Escalation Protocol.`,
      previousEvaluation: evalResult,
    };
  }

  // Also check if user explicitly marked recent intervention as not_helpful
  if (latestIntervention.user_response === 'not_helpful' && evalResult.postSlope <= 0) {
    return {
      escalationRequired: true,
      reason: `Người dùng đánh giá lời khuyên trước không hữu ích và điểm số tiếp tục không tăng.`,
      previousEvaluation: evalResult,
    };
  }

  return {
    escalationRequired: false,
    previousEvaluation: evalResult,
  };
}
