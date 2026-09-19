/**
 * Supabase Database Entity Definitions & Application Types
 * Motivation Decay Tracker
 */

export type ProjectStatus = 'active' | 'paused' | 'archived';

export type TrendFlagType = 'declining' | 'stable' | 'improving' | 'volatile';

export type SuggestionType =
  | 'break_task'
  | 'take_break'
  | 'change_approach'
  | 'celebrate_progress';

export type UserResponse = 'helpful' | 'not_helpful' | 'dismissed';

export type InterventionTone = 'compassionate' | 'action_oriented' | 'scientific';

export interface Project {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  created_at: string;
  archived_at?: string | null;
}

export interface Checkin {
  id: string;
  project_id: string;
  user_id?: string | null;
  score: number; // 1 - 10
  energy?: number | null; // 1 - 10 optional
  context_note?: string | null;
  created_at: string;
}

export interface TrendFlag {
  id: string;
  project_id: string;
  window_start: string;
  window_end: string;
  slope: number;
  flag_type: TrendFlagType;
  confidence: number; // R^2 or reliability score (0 - 1)
  created_at: string;
  acknowledged_at?: string | null;
}

export interface Intervention {
  id: string;
  project_id: string;
  trend_flag_id?: string | null;
  suggestion_type: SuggestionType;
  message: string;
  user_response?: UserResponse | null;
  template_id?: string | null;
  tone?: InterventionTone | null;
  action_step?: string | null;
  created_at: string;
}

/**
 * Result of regression analysis and trend evaluation
 */
export interface TrendAnalysisResult {
  projectId: string;
  windowStart: string;
  windowEnd: string;
  slope: number;
  rSquared: number;
  flagType: TrendFlagType;
  isSuddenDrop: boolean;
  suddenDropDiff?: number;
  dataPointCount: number;
  stdDev: number;
  averageScore: number;
  recentAverageEnergy?: number | null;
  recommendedSuggestion?: SuggestionType;
  message?: string;
  historicalTrendLine: Array<{
    date: string;
    actualScore?: number;
    predictedScore?: number;
    energy?: number | null;
    note?: string | null;
  }>;
}

/**
 * Result of intervention recovery efficacy analysis
 */
export type EfficacyStatus = 'effective' | 'partial' | 'ineffective' | 'insufficient_data';

export interface EfficacyEvaluation {
  interventionId: string;
  projectId: string;
  preSlope: number;
  postSlope: number;
  recoveryDelta: number; // postSlope - preSlope
  status: EfficacyStatus;
  isEffective: boolean;
  preCheckinCount: number;
  postCheckinCount: number;
  evaluatedAt: string;
  escalationRecommended: boolean;
}

/**
 * Aggregated telemetry metric for template A/B performance tracking
 */
export interface TemplateTelemetryMetric {
  templateId: string;
  suggestionType: SuggestionType;
  tone: InterventionTone;
  impressions: number;
  helpfulCount: number;
  notHelpfulCount: number;
  dismissedCount: number;
  acceptanceRate: number; // helpful / impressions (0 - 100%)
  feedbackCount: number;
}

/**
 * Quick 1-Tap Context Tag Definition
 */
export type ContextTagCategory = 'biological' | 'cognitive' | 'milestone';

export interface ContextTag {
  id: string;
  label: string;
  category: ContextTagCategory;
  emoji: string;
}

