/**
 * Motivation Decay Tracker - Configuration Thresholds
 * 
 * Centralized configuration for linear regression sliding windows,
 * decay detection sensitivities, and intervention cooldowns.
 */

export const TREND_THRESHOLDS = {
  /**
   * Length of the sliding window in days to analyze motivation trajectory.
   * Default: 21 days (sufficient to distinguish gradual decay from a temporary bad day).
   */
  WINDOW_DAYS: 21,

  /**
   * Minimum number of check-ins within the window required to perform reliable regression.
   * Below this, confidence is too low to raise automated decay flags.
   */
  MIN_CHECKINS_REQUIRED: 5,

  /**
   * Slope threshold indicating a steady motivation decline.
   * Example: -0.15 means an average loss of 1.5 points over 10 days.
   */
  DECLINING_SLOPE_THRESHOLD: -0.15,

  /**
   * Slope threshold indicating an upward motivational trend.
   */
  IMPROVING_SLOPE_THRESHOLD: 0.10,

  /**
   * Standard deviation threshold for classifying high volatility.
   * If motivation swings widely without a clear single-direction slope.
   */
  VOLATILITY_STD_DEV_THRESHOLD: 2.0,

  /**
   * Sudden drop threshold: A drop of this many points within 48 hours indicates
   * acute burnout or roadblock rather than gradual erosion.
   */
  SUDDEN_DROP_THRESHOLD: 3.5,

  /**
   * Minimum coefficient of determination (R^2) to consider the regression fit strong.
   */
  MIN_R_SQUARED_STRONG_FIT: 0.35,

  /**
   * Anti-spam cooldown (in days) between automated interventions for the same project.
   */
  INTERVENTION_COOLDOWN_DAYS: 7,
} as const;
