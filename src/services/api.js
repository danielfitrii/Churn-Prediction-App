/**
 * API service for making HTTP requests to the backend
 */

import { API_ENDPOINTS } from '../constants';

/**
 * Get the backend URL based on environment
 * @returns {string} - Backend API URL
 */
function getBackendUrl() {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  return (
    import.meta.env.VITE_PROD_BACKEND_URL ||
    'https://churn-prediction-flask-app-hquhpswb6q-as.a.run.app'
  );
}

/**
 * Make a prediction request to the backend
 * @param {Array<number>} features - Array of feature values
 * @param {string} model - Model key ('logistic' or 'randomForest')
 * @param {string} thresholdType - Threshold type ('f1' or 'cost')
 * @returns {Promise<Object>} - Prediction result
 * @throws {Error} - If the request fails
 */
export async function makePrediction(features, model, thresholdType) {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${API_ENDPOINTS.PREDICT}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features,
        model,
        threshold_type: thresholdType,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If we can't parse the error response, use the status text
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Validate required fields
    if (data.probability === undefined || data.prediction === undefined) {
      throw new Error('Invalid response from prediction server');
    }

    return {
      prediction: data.prediction,
      probability: data.probability,
      threshold_type: data.threshold_type,
      threshold: data.threshold,
    };
  } catch (error) {
    // Provide more user-friendly error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to prediction server. Please check your internet connection and try again.'
      );
    }
    throw error;
  }
}

/**
 * Health check endpoint
 * @returns {Promise<Object>} - Health status
 */
export async function healthCheck() {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${API_ENDPOINTS.HEALTH}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Health check error: ${error.message}`);
  }
}





