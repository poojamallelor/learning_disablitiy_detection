/**
 * API Service for React Frontend
 * ==============================
 *
 * This module provides functions to communicate with the
 * Learning Disability Detection API from React components.
 *
 * Usage in React:
 *   import { predictDisability, getLabels, checkHealth } from '../services/mlapi';
 *
 *   const result = await predictDisability({
 *     reading: 60,
 *     writing: 80,
 *     math: 70,
 *     attention: 50
 *   });
 */

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Response types
export interface PredictionResult {
  prediction: string;
  confidence: number;
  input_scores: {
    reading: number;
    writing: number;
    math: number;
    attention: number;
  };
  prediction_code: number;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  message: string;
}

export interface LabelsMap {
  [key: number]: string;
}

/**
 * Check API health and model status
 * @returns {Promise<HealthStatus>} Health status
 */
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

/**
 * Get available prediction labels
 * @returns {Promise<LabelsMap>} Mapping of codes to labels
 */
export async function getLabels(): Promise<LabelsMap> {
  try {
    const response = await fetch(`${API_BASE_URL}/labels`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.labels;
  } catch (error) {
    console.error('Failed to get labels:', error);
    throw error;
  }
}

/**
 * Make a prediction based on test scores
 * @param {Object} scores - Test scores object
 * @param {number} scores.reading - Reading score (0-100)
 * @param {number} scores.writing - Writing score (0-100)
 * @param {number} scores.math - Math score (0-100)
 * @param {number} scores.attention - Attention score (0-100)
 * @returns {Promise<PredictionResult>} Prediction result
 */
export async function predictDisability(scores: {
  reading: number;
  writing: number;
  math: number;
  attention: number;
}): Promise<PredictionResult> {
  // Validate input
  if (!scores || typeof scores !== 'object') {
    throw new Error('Invalid scores object');
  }

  const requiredFields = ['reading', 'writing', 'math', 'attention'];
  for (const field of requiredFields) {
    if (!(field in scores)) {
      throw new Error(`Missing required field: ${field}`);
    }
    const value = scores[field as keyof typeof scores];
    if (typeof value !== 'number' || value < 0 || value > 100) {
      throw new Error(`${field} must be a number between 0-100`);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scores),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const result: PredictionResult = await response.json();
    return result;
  } catch (error) {
    console.error('Prediction failed:', error);
    throw error;
  }
}

/**
 * Make a prediction with error handling and logging
 * Useful wrapper for components that want additional error context
 * @param {Object} scores - Test scores
 * @returns {Promise<PredictionResult|null>} Result or null on error
 */
export async function predictDisabilityWithHandler(scores: {
  reading: number;
  writing: number;
  math: number;
  attention: number;
}): Promise<PredictionResult | null> {
  try {
    console.log('Making prediction with scores:', scores);
    const result = await predictDisability(scores);
    console.log('Prediction result:', result);
    return result;
  } catch (error) {
    console.error('Prediction error:', error);
    return null;
  }
}

/**
 * Get API configuration
 * @returns {Object} Configuration object
 */
export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    endpoints: {
      predict: `${API_BASE_URL}/predict`,
      health: `${API_BASE_URL}/health`,
      labels: `${API_BASE_URL}/labels`,
      docs: `${API_BASE_URL}/docs`,
    },
  };
}

export default {
  predictDisability,
  predictDisabilityWithHandler,
  checkHealth,
  getLabels,
  getApiConfig,
};
