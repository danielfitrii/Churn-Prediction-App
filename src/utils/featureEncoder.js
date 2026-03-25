/**
 * Utility functions for encoding form data into model features
 */

import {
  CONTRACT_TYPES,
  PAYMENT_METHODS,
  INTERNET_SERVICE_TYPES,
  YES_NO_OPTIONS,
} from '../constants';

/**
 * Encodes form data into the feature array expected by the ML model
 * @param {Object} formData - The form data object
 * @returns {Array<number>} - Array of 12 feature values
 */
export function encodeFeatures(formData) {
  return [
    // SeniorCitizen
    formData.seniorCitizen === YES_NO_OPTIONS.YES ? 1 : 0,
    // tenure
    Number(formData.tenure),
    // PhoneService_Yes
    formData.phoneService === YES_NO_OPTIONS.YES ? 1 : 0,
    // MultipleLines_Yes
    formData.multipleLines === YES_NO_OPTIONS.YES ? 1 : 0,
    // InternetService_Fiber optic
    formData.internetService === INTERNET_SERVICE_TYPES.FIBER_OPTIC ? 1 : 0,
    // InternetService_No
    formData.internetService === INTERNET_SERVICE_TYPES.NONE ? 1 : 0,
    // OnlineSecurity_Yes
    formData.onlineSecurity === YES_NO_OPTIONS.YES ? 1 : 0,
    // StreamingTV_Yes
    formData.streamingTV === YES_NO_OPTIONS.YES ? 1 : 0,
    // StreamingMovies_Yes
    formData.streamingMovies === YES_NO_OPTIONS.YES ? 1 : 0,
    // Contract_One year
    formData.contract === CONTRACT_TYPES.ONE_YEAR ? 1 : 0,
    // Contract_Two year
    formData.contract === CONTRACT_TYPES.TWO_YEAR ? 1 : 0,
    // PaymentMethod_Electronic check
    formData.paymentMethod === PAYMENT_METHODS.ELECTRONIC_CHECK ? 1 : 0,
  ];
}

/**
 * Calculates total charges based on tenure and monthly charges
 * @param {number} tenure - Customer tenure in months
 * @param {number} monthlyCharges - Monthly charges amount
 * @returns {number} - Total charges
 */
export function calculateTotalCharges(tenure, monthlyCharges) {
  return Number(tenure) * Number(monthlyCharges);
}





