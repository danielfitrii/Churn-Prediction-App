/**
 * Utility functions for identifying churn factors
 */

import { CONTRACT_TYPES, PAYMENT_METHODS, INTERNET_SERVICE_TYPES, YES_NO_OPTIONS } from '../constants';

/**
 * Get key churn factors based on form data
 * @param {Object} formData - The form data object
 * @param {string} selectedModel - Selected model key
 * @returns {Array<Object>} - Array of churn factor objects with message and severity
 */
export function getChurnFactors(formData, selectedModel) {
  const factors = [];

  if (formData.contract === CONTRACT_TYPES.MONTH_TO_MONTH) {
    factors.push({
      message: 'Month-to-month contract increases churn risk',
      severity: 'high',
    });
  }

  if (formData.paymentMethod === PAYMENT_METHODS.ELECTRONIC_CHECK) {
    factors.push({
      message: 'Electronic check payment method',
      severity: 'medium',
    });
  }

  if (formData.internetService === INTERNET_SERVICE_TYPES.FIBER_OPTIC) {
    factors.push({
      message: 'Fiber optic internet service',
      severity: 'medium',
    });
  }

  if (formData.onlineSecurity === YES_NO_OPTIONS.NO) {
    factors.push({
      message: 'No online security',
      severity: 'medium',
    });
  }

  if (formData.techSupport === YES_NO_OPTIONS.NO) {
    factors.push({
      message: 'No tech support',
      severity: 'medium',
    });
  }

  if (formData.tenure < 12) {
    factors.push({
      message: 'Low tenure (less than 12 months)',
      severity: 'high',
    });
  }

  if (formData.seniorCitizen === YES_NO_OPTIONS.YES) {
    factors.push({
      message: 'Senior citizen customers may have higher churn risk in some segments',
      severity: 'medium',
    });
  }

  if (formData.phoneService === YES_NO_OPTIONS.NO) {
    factors.push({
      message: 'No phone service',
      severity: 'low',
    });
  }

  if (formData.multipleLines === YES_NO_OPTIONS.YES) {
    factors.push({
      message: 'Multiple lines',
      severity: 'low',
    });
  }

  if (formData.streamingMovies === YES_NO_OPTIONS.YES) {
    factors.push({
      message: 'Streaming movies enabled',
      severity: 'low',
    });
  }

  return factors;
}

/**
 * Get retention strategies based on risk level and form data
 * @param {string} riskLevel - Risk level ('Low', 'Medium', 'High')
 * @param {Object} formData - The form data object
 * @returns {Array<string>} - Array of retention strategy messages
 */
export function getRetentionStrategies(riskLevel, formData) {
  const strategies = [];

  // Risk-based strategies
  if (riskLevel === 'High') {
    strategies.push(
      'Contact the customer immediately with a personalized offer or discount.',
      'Assign a dedicated support representative to address concerns.'
    );
  } else if (riskLevel === 'Medium') {
    strategies.push(
      'Send a targeted email with loyalty rewards or service improvements.',
      'Offer a free trial of premium features or support.'
    );
  } else {
    strategies.push('Continue providing excellent service and monitor satisfaction.');
  }

  // Factor-based strategies
  if (formData.contract === CONTRACT_TYPES.MONTH_TO_MONTH) {
    strategies.push('Encourage switching to a longer-term contract with incentives.');
  }

  if (formData.paymentMethod === PAYMENT_METHODS.ELECTRONIC_CHECK) {
    strategies.push(
      'Promote more secure or convenient payment methods (e.g., credit card, auto-pay).'
    );
  }

  if (formData.internetService === INTERNET_SERVICE_TYPES.FIBER_OPTIC) {
    strategies.push('Highlight the benefits and reliability of your fiber optic service.');
  }

  if (formData.onlineSecurity === YES_NO_OPTIONS.NO) {
    strategies.push('Offer a free or discounted online security package.');
  }

  if (formData.techSupport === YES_NO_OPTIONS.NO) {
    strategies.push('Promote premium or 24/7 tech support options.');
  }

  if (formData.tenure < 12) {
    strategies.push('Send a welcome package or onboarding materials to new customers.');
  }

  return strategies;
}





