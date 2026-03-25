/**
 * Utility functions for calculating risk levels and formatting predictions
 */

import { RISK_LEVELS, RISK_THRESHOLDS, MODEL_DISPLAY_NAMES } from '../constants';

/**
 * Calculate risk level based on probability
 * @param {number} probability - Churn probability (0-1)
 * @returns {string} - Risk level ('Low', 'Medium', or 'High')
 */
export function calculateRiskLevel(probability) {
  if (probability < RISK_THRESHOLDS.LOW) {
    return RISK_LEVELS.LOW;
  }
  if (probability < RISK_THRESHOLDS.MEDIUM) {
    return RISK_LEVELS.MEDIUM;
  }
  return RISK_LEVELS.HIGH;
}

/**
 * Format prediction result for display
 * @param {Object} result - Raw prediction result from API
 * @param {string} modelKey - Model key used for prediction
 * @returns {Object} - Formatted prediction result
 */
export function formatPredictionResult(result, modelKey) {
  const probability = result.probability;
  const churnProbability = (probability * 100).toFixed(1);
  const riskLevel = calculateRiskLevel(probability);

  return {
    churnProbability,
    riskLevel,
    model: MODEL_DISPLAY_NAMES[modelKey] || modelKey,
    probability,
    prediction: result.prediction,
    ...(result.threshold_type !== undefined && { thresholdType: result.threshold_type }),
    ...(result.threshold !== undefined && { threshold: result.threshold }),
  };
}

/**
 * Get risk level color class
 * @param {string} riskLevel - Risk level
 * @returns {string} - Tailwind color class
 */
export function getRiskLevelColor(riskLevel) {
  switch (riskLevel) {
    case RISK_LEVELS.LOW:
      return 'text-green-500';
    case RISK_LEVELS.MEDIUM:
      return 'text-yellow-500';
    case RISK_LEVELS.HIGH:
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}





