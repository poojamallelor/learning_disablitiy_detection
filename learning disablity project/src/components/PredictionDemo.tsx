/**
 * Example React Component: ML Prediction Component
 * ================================================
 *
 * This is an example of how to use the ML API service in a React component.
 * Copy this code into your components and adapt for your use case.
 *
 * Usage:
 * import PredictionDemo from 'components/PredictionDemo';
 * <PredictionDemo />
 */

import React, { useState, useEffect } from 'react';
import { predictDisability, checkHealth, getLabels } from '../services/mlapi';

interface ScoresInput {
  reading: number;
  writing: number;
  math: number;
  attention: number;
}

interface PredictionState {
  loading: boolean;
  result: any | null;
  error: string | null;
  apiReady: boolean;
}

/**
 * Example component showing how to use the prediction API
 */
export default function PredictionDemo() {
  const [scores, setScores] = useState<ScoresInput>({
    reading: 70,
    writing: 70,
    math: 70,
    attention: 70,
  });

  const [prediction, setPrediction] = useState<PredictionState>({
    loading: false,
    result: null,
    error: null,
    apiReady: false,
  });

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  /**
   * Check if API is available
   */
  async function checkApiHealth() {
    try {
      await checkHealth();
      setPrediction(prev => ({ ...prev, apiReady: true, error: null }));
    } catch (error) {
      setPrediction(prev => ({
        ...prev,
        apiReady: false,
        error: 'API server not available. Make sure backend is running on http://localhost:8000',
      }));
    }
  }

  /**
   * Handle score input changes
   */
  function handleScoreChange(field: keyof ScoresInput, value: number) {
    // Ensure value is 0-100
    const validValue = Math.max(0, Math.min(100, value));
    setScores(prev => ({
      ...prev,
      [field]: validValue,
    }));
  }

  /**
   * Make prediction
   */
  async function handlePredict() {
    setPrediction(prev => ({
      ...prev,
      loading: true,
      error: null,
      result: null,
    }));

    try {
      const result = await predictDisability(scores);
      setPrediction(prev => ({
        ...prev,
        loading: false,
        result: result,
        error: null,
      }));
    } catch (error: any) {
      setPrediction(prev => ({
        ...prev,
        loading: false,
        result: null,
        error: `Prediction failed: ${error.message}`,
      }));
    }
  }

  /**
   * Reset form
   */
  function handleReset() {
    setScores({
      reading: 70,
      writing: 70,
      math: 70,
      attention: 70,
    });
    setPrediction({
      loading: false,
      result: null,
      error: null,
      apiReady: true,
    });
  }

  // API not available
  if (!prediction.apiReady) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h2>⚠️ API Not Available</h2>
          <p>{prediction.error}</p>
          <p>To start the backend server, run:</p>
          <code style={styles.code}>python backend/main.py</code>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🧠 Learning Disability Prediction</h1>

        {/* Score Input Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📝 Enter Test Scores</h2>

          <div style={styles.scoreGrid}>
            {Object.entries(scores).map(([field, value]) => (
              <div key={field} style={styles.scoreInput}>
                <label style={styles.label}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={e => handleScoreChange(field as keyof ScoresInput, parseInt(e.target.value))}
                  style={styles.slider}
                />
                <div style={styles.scoreValue}>{value}</div>
              </div>
            ))}
          </div>

          <div style={styles.scoreDisplay}>
            <div style={styles.scoreBox}>
              <p>📖 Reading: <strong>{scores.reading}</strong></p>
            </div>
            <div style={styles.scoreBox}>
              <p>✍️ Writing: <strong>{scores.writing}</strong></p>
            </div>
            <div style={styles.scoreBox}>
              <p>🔢 Math: <strong>{scores.math}</strong></p>
            </div>
            <div style={styles.scoreBox}>
              <p>👁️ Attention: <strong>{scores.attention}</strong></p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonGroup}>
          <button
            onClick={handlePredict}
            disabled={prediction.loading}
            style={{
              ...styles.button,
              ...styles.predictButton,
              opacity: prediction.loading ? 0.6 : 1,
              cursor: prediction.loading ? 'wait' : 'pointer',
            }}
          >
            {prediction.loading ? '⏳ Predicting...' : '🚀 Get Prediction'}
          </button>
          <button
            onClick={handleReset}
            style={styles.button}
          >
            🔄 Reset
          </button>
        </div>

        {/* Error Display */}
        {prediction.error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>❌ {prediction.error}</p>
          </div>
        )}

        {/* Result Display */}
        {prediction.result && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📊 Prediction Result</h2>

            <div style={styles.resultBox}>
              <div style={styles.resultPrediction}>
                <p style={styles.predictedLabel}>Prediction:</p>
                <p style={{ ...styles.predictionName, ...getPredictionColor(prediction.result.prediction) }}>
                  {prediction.result.prediction}
                </p>
              </div>

              <div style={styles.resultConfidence}>
                <p style={styles.confidenceLabel}>Confidence:</p>
                <div style={styles.confidenceBar}>
                  <div
                    style={{
                      ...styles.confidenceBarFill,
                      width: `${prediction.result.confidence * 100}%`,
                      backgroundColor: getConfidenceColor(prediction.result.confidence),
                    }}
                  />
                </div>
                <p style={styles.confidenceValue}>
                  {(prediction.result.confidence * 100).toFixed(1)}%
                </p>
              </div>

              <div style={styles.resultCode}>
                <p>Code: <strong>{prediction.result.prediction_code}</strong></p>
              </div>
            </div>

            {/* Explanations */}
            <div style={styles.explanation}>
              {renderExplanation(prediction.result.prediction)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Styling
// ============================================
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'transparent',
    minHeight: '100vh',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(16px)',
    borderRadius: '24px',
    boxShadow: '0 10px 30px -5px rgba(76, 29, 149, 0.05)',
    border: '1px solid rgba(109, 40, 217, 0.08)',
    padding: '2.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 900,
    marginBottom: '2rem',
    textAlign: 'center',
    color: '#2D1B69',
  },
  section: {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(109, 40, 217, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(109, 40, 217, 0.08)',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: 800,
    marginBottom: '1rem',
    color: '#2D1B69',
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  scoreInput: {
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '12px',
    border: '1px solid rgba(109, 40, 217, 0.08)',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '800',
    color: '#4B5563',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  scoreValue: {
    marginTop: '0.5rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#6D28D9',
    textAlign: 'center',
  },
  scoreDisplay: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '1rem',
  },
  scoreBox: {
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px solid rgba(109, 40, 217, 0.15)',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '12px',
    border: '1px solid #DDD6FE',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    color: '#6D28D9',
    cursor: 'pointer',
    fontWeight: '800',
    transition: 'all 0.3s ease',
  },
  predictButton: {
    background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 4px 14px rgba(109, 40, 217, 0.25)',
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    borderLeft: '4px solid #8B5CF6',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  errorText: {
    color: '#6D28D9',
    margin: 0,
    fontWeight: 'bold',
  },
  code: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    color: '#2D1B69',
  },
  resultBox: {
    padding: '1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '16px',
    border: '2px solid rgba(109, 40, 217, 0.15)',
    marginBottom: '1rem',
  },
  resultPrediction: {
    marginBottom: '1.5rem',
  },
  predictedLabel: {
    color: '#4B5563',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  predictionName: {
    fontSize: '2rem',
    fontWeight: '900',
    margin: 0,
  },
  resultConfidence: {
    marginBottom: '1.5rem',
  },
  confidenceLabel: {
    color: '#4B5563',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  confidenceBar: {
    width: '100%',
    height: '24px',
    backgroundColor: '#EDE9FE',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  confidenceBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  confidenceValue: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#2D1B69',
  },
  resultCode: {
    color: '#4B5563',
    fontWeight: 'bold',
  },
  explanation: {
    padding: '1rem',
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    borderLeft: '4px solid #8B5CF6',
    borderRadius: '8px',
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get color for prediction based on type
 */
function getPredictionColor(prediction: string): React.CSSProperties {
  const colors: { [key: string]: string } = {
    'Normal': '#2D1B69',
    'Dyslexia': '#6D28D9',
    'Dysgraphia': '#4C1D95',
    'Dyscalculia': '#8B5CF6',
    'ADHD': '#6D28D9',
  };

  return {
    color: colors[prediction] || '#2D1B69',
  };
}

/**
 * Get color for confidence bar
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#6D28D9';
  if (confidence >= 0.6) return '#8B5CF6';
  return '#2D1B69';
}

/**
 * Render explanation based on prediction
 */
function renderExplanation(prediction: string): JSX.Element {
  const explanations: { [key: string]: string } = {
    'Dyslexia': '📖 Dyslexia: Difficulty with reading and language processing. Consider reading support programs and assistive technology.',
    'Dysgraphia': '✍️ Dysgraphia: Difficulty with writing and written expression. May benefit from speech-to-text tools and writing support.',
    'Dyscalculia': '🔢 Dyscalculia: Difficulty with mathematics and numerical concepts. Mathematical tools and visualizations may help.',
    'ADHD': '👁️ ADHD: Attention deficit/hyperactivity disorder. May benefit from structured environments and attention support.',
    'Normal': '✅ Normal: Scores indicate typical development across all areas. No significant learning disabilities detected.',
  };

  return (
    <p style={{ margin: 0, color: '#4B5563', lineHeight: '1.6', fontWeight: 600 }}>
      {explanations[prediction] || 'No explanation available.'}
    </p>
  );
}
