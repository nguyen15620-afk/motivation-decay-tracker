/**
 * Motivation Decay Tracker - Linear Regression & Trend Detection Engine
 * 
 * Implements Ordinary Least Squares (OLS) regression over sliding windows,
 * calculates statistical variance, detects gradual decay vs. acute sudden drop,
 * and classifies motivation trends.
 */

import { TREND_THRESHOLDS } from './thresholds';
import { Checkin, TrendAnalysisResult, TrendFlagType } from '../supabase/types';

interface RegressionDataPoint {
  date: string;
  timestamp: number;
  dayOffset: number; // Days elapsed relative to window start
  score: number;
  energy?: number | null;
  note?: string | null;
}

/**
 * Computes Ordinary Least Squares (OLS) linear regression
 * Equation: y = slope * x + intercept
 */
export function calculateLinearRegression(points: Array<{ x: number; y: number }>): {
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: points[0]?.y ?? 5, rSquared: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denominatorX = n * sumX2 - sumX * sumX;
  const denominatorY = n * sumY2 - sumY * sumY;

  // Horizontal line / zero variance in X
  if (Math.abs(denominatorX) < 1e-9) {
    return { slope: 0, intercept: sumY / n, rSquared: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominatorX;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate coefficient of determination R^2
  let rSquared = 0;
  if (denominatorY > 1e-9) {
    const numeratorR = n * sumXY - sumX * sumY;
    rSquared = (numeratorR * numeratorR) / (denominatorX * denominatorY);
  }

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    rSquared: Math.min(1, Math.max(0, Number(rSquared.toFixed(4)))),
  };
}

/**
 * Calculates standard deviation for a set of numeric values.
 */
export function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Number(Math.sqrt(variance).toFixed(4));
}

/**
 * Checks whether the most recent checkins exhibited an acute sudden drop (e.g. >= 3.5 points in 48h).
 */
export function detectSuddenDrop(
  sortedCheckins: Checkin[],
  threshold = TREND_THRESHOLDS.SUDDEN_DROP_THRESHOLD
): { isSuddenDrop: boolean; diff: number } {
  if (sortedCheckins.length < 2) {
    return { isSuddenDrop: false, diff: 0 };
  }

  // Look at the latest checkin compared to the previous 1-2 checkins within 48h
  const latest = sortedCheckins[sortedCheckins.length - 1];
  const latestTime = new Date(latest.created_at).getTime();

  for (let i = sortedCheckins.length - 2; i >= Math.max(0, sortedCheckins.length - 3); i--) {
    const prev = sortedCheckins[i];
    const prevTime = new Date(prev.created_at).getTime();
    const hoursDiff = (latestTime - prevTime) / (1000 * 60 * 60);

    // If within 48 hours (and not in the future) and drop exceeds threshold
    if (hoursDiff >= 0 && hoursDiff <= 48) {
      const drop = prev.score - latest.score;
      if (drop >= threshold) {
        return { isSuddenDrop: true, diff: drop };
      }
    }
  }

  return { isSuddenDrop: false, diff: 0 };
}

/**
 * Analyzes the motivation trend for a project given its checkin history.
 * 
 * @param projectId - Target project UUID
 * @param checkins - Full or filtered checkin history
 * @param windowDays - Sliding window size in days (defaults to 21)
 */
export function analyzeProjectTrend(
  projectId: string,
  checkins: Checkin[],
  windowDays = TREND_THRESHOLDS.WINDOW_DAYS
): TrendAnalysisResult {
  // Sort check-ins in ascending chronological order
  const sorted = [...checkins].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const now = new Date();
  const windowStartMs = now.getTime() - windowDays * 24 * 60 * 60 * 1000;

  // Filter checkins within sliding window
  const windowCheckins = sorted.filter(
    (c) => new Date(c.created_at).getTime() >= windowStartMs
  );

  const windowStartStr = new Date(windowStartMs).toISOString().split('T')[0];
  const windowEndStr = now.toISOString().split('T')[0];

  // If there are zero check-ins in window, return default stable empty result
  if (windowCheckins.length === 0) {
    return {
      projectId,
      windowStart: windowStartStr,
      windowEnd: windowEndStr,
      slope: 0,
      rSquared: 0,
      flagType: 'stable',
      isSuddenDrop: false,
      dataPointCount: 0,
      stdDev: 0,
      averageScore: 5,
      historicalTrendLine: [],
    };
  }

  // Normalize points with day offset from the earliest point in window
  const baseTime = new Date(windowCheckins[0].created_at).getTime();
  const regressionPoints: RegressionDataPoint[] = windowCheckins.map((c) => {
    const t = new Date(c.created_at).getTime();
    const dayOffset = (t - baseTime) / (1000 * 60 * 60 * 24);
    return {
      date: new Date(c.created_at).toISOString().split('T')[0],
      timestamp: t,
      dayOffset,
      score: c.score,
      energy: c.energy,
      note: c.context_note,
    };
  });

  const scores = windowCheckins.map((c) => c.score);
  const avgScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  const stdDev = calculateStdDev(scores);

  // Compute regression
  const ols = calculateLinearRegression(
    regressionPoints.map((p) => ({ x: p.dayOffset, y: p.score }))
  );

  // Detect acute sudden drop
  const suddenDropResult = detectSuddenDrop(windowCheckins);

  // Classify Trend
  let flagType: TrendFlagType = 'stable';

  if (windowCheckins.length >= TREND_THRESHOLDS.MIN_CHECKINS_REQUIRED) {
    if (ols.slope <= TREND_THRESHOLDS.DECLINING_SLOPE_THRESHOLD) {
      flagType = 'declining';
    } else if (ols.slope >= TREND_THRESHOLDS.IMPROVING_SLOPE_THRESHOLD) {
      flagType = 'improving';
    } else if (stdDev >= TREND_THRESHOLDS.VOLATILITY_STD_DEV_THRESHOLD) {
      flagType = 'volatile';
    } else {
      flagType = 'stable';
    }
  } else {
    // Insufficient data points: remains stable, low confidence
    flagType = 'stable';
  }

  // Generate chart trendline data mapping actual vs predicted
  const historicalTrendLine = regressionPoints.map((p) => {
    const predicted = Number((ols.slope * p.dayOffset + ols.intercept).toFixed(2));
    // Clamping predicted score between 1 and 10 for realistic plotting
    const clampedPredicted = Math.min(10, Math.max(1, predicted));

    return {
      date: p.date,
      actualScore: p.score,
      predictedScore: clampedPredicted,
      energy: p.energy ?? null,
      note: p.note ?? null,
    };
  });

  // Calculate recent average energy (last 3 checkins in window with non-null energy)
  const recentEnergies = windowCheckins
    .slice(-3)
    .map((c) => c.energy)
    .filter((e): e is number => e !== null && e !== undefined);
  const recentAverageEnergy = recentEnergies.length > 0
    ? Number((recentEnergies.reduce((a, b) => a + b, 0) / recentEnergies.length).toFixed(1))
    : null;

  return {
    projectId,
    windowStart: windowStartStr,
    windowEnd: windowEndStr,
    slope: ols.slope,
    rSquared: ols.rSquared,
    flagType,
    isSuddenDrop: suddenDropResult.isSuddenDrop,
    suddenDropDiff: suddenDropResult.diff,
    dataPointCount: windowCheckins.length,
    stdDev,
    averageScore: avgScore,
    recentAverageEnergy,
    historicalTrendLine,
  };
}
