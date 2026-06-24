import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import BrainScene from '../components/3D/BrainScene';
import '../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const ResultsPage = () => {
  const navigate = useNavigate();
  const {
    authToken,
    currentAssessment,
    testResults,
    showError,
    showSuccess,
    setIsLoading,
  } = useAppContext();

  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [allTestResults, setAllTestResults] = useState([]);
  const [incompleteError, setIncompleteError] = useState(null);

  // ========================================
  // INITIALIZATION & ANALYSIS
  // ========================================

  useEffect(() => {
    if (!authToken || !currentAssessment) {
      navigate('/dashboard');
      return;
    }

    analyzeResults();
  }, [authToken, currentAssessment]);

  const analyzeResults = async () => {
    setIsAnalyzing(true);
    setIsLoading(true);
    const startTime = Date.now();

    try {
      // First, fetch all test results for this assessment
      const resultsResponse = await fetch(
        `${API_BASE_URL}/results/${currentAssessment.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setAllTestResults(resultsData.test_results || []);

        // Now call the analysis endpoint
        const analysisResponse = await fetch(
          `${API_BASE_URL}/results/analyze`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              assessment_id: currentAssessment.id,
            }),
          }
        );

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          
          // Force a minimum of 4 seconds to display the futuristic scan animation
          const elapsed = Date.now() - startTime;
          const minDuration = 4000;
          if (elapsed < minDuration) {
            await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
          }
          
          setPrediction(analysisData.prediction);
          showSuccess('Analysis complete!');
        } else {
          const errorData = await analysisResponse.json();
          if (errorData.error === 'Assessment Incomplete') {
            setIncompleteError(errorData.message);
          } else {
            showError(errorData.error || 'Failed to analyze results');
          }
        }
      } else {
        showError('Failed to fetch results');
      }
    } catch (error) {
      console.error('Error analyzing results:', error);
      showError('Error during analysis');
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const getDisabilityColor = (disability) => {
    const colors = {
      'Dyslexia': 'from-[#5B21B6] to-[#8B5CF6] border-purple-500 shadow-purple-900/40',
      'Dysgraphia': 'from-[#2D1B69] to-[#5B21B6] border-purple-600 shadow-purple-950/40',
      'Dyscalculia': 'from-[#8B5CF6] to-[#C4B5FD] border-purple-400 shadow-purple-800/40',
      'ADHD': 'from-[#5B21B6] to-[#C4B5FD] border-purple-500 shadow-purple-900/40',
      'No Learning Disability': 'from-[#2D1B69] to-[#8B5CF6] border-purple-600 shadow-purple-950/40',
      'No Learning Disability Detected': 'from-[#2D1B69] to-[#8B5CF6] border-purple-600 shadow-purple-950/40',
      'High Risk / Severe Difficulty': 'from-[#7F1D1D] to-[#B91C1C] border-red-700 shadow-red-950/50',
    };
    return colors[disability] || 'from-[#5B21B6] to-[#8B5CF6]';
  };

  const getScoreFromTestResults = (testType) => {
    const result = allTestResults.find(r => r.test_type === testType);
    return result ? result.score : 0;
  };

  const getPercentageScore = (val) => {
    if (val === undefined || val === null) return 75.0;
    const num = parseFloat(val);
    if (isNaN(num)) return 75.0;
    return num <= 1.01 ? num * 100 : num;
  };

  const chartData = {
    labels: ['Reading Accuracy', 'Writing Accuracy', 'Math Accuracy', 'Puzzle/Logic Accuracy'],
    datasets: [
      {
        label: 'Accuracy Score (%)',
        data: [
          getScoreFromTestResults('reading'),
          getScoreFromTestResults('writing'),
          getScoreFromTestResults('math'),
          getScoreFromTestResults('puzzle'),
        ],
        backgroundColor: [
          'rgba(139, 92, 246, 0.75)', // Accent Purple
          'rgba(196, 181, 253, 0.75)', // Light Lavender
          'rgba(91, 33, 182, 0.75)',  // Primary Purple
          'rgba(255, 255, 255, 0.75)', // White
        ],
        borderColor: [
          'rgb(139, 92, 246)',
          'rgb(196, 181, 253)',
          'rgb(91, 33, 182)',
          'rgb(255, 255, 255)',
        ],
        borderWidth: 2,
        borderRadius: 8
      },
    ],
  };

  // ========================================
  // HANDLERS
  // ========================================

  const handleViewHistory = () => {
    navigate('/dashboard');
  };

  const handleNewAssessment = () => {
    navigate('/dashboard');
  };

  // ========================================
  // RENDER
  // ========================================

  if (incompleteError) {
    return (
      <div className="min-h-screen bg-[#F8F7FC] p-6 flex flex-col items-center justify-center text-slate-800 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl card p-8 border border-purple-100 text-center space-y-6 shadow-2xl"
        >
          <span className="text-6xl filter drop-shadow-md">⚠️</span>
          <h2 className="text-3xl font-black text-[#2D1B69] tracking-tight">
            Assessment Incomplete
          </h2>
          <p className="text-[#4B5563] text-sm font-semibold leading-relaxed">
            {incompleteError}
          </p>
          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="btn-primary inline-flex items-center gap-2"
            >
              Go to Dashboard 🎒
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#F8F7FC] p-6 flex flex-col items-center justify-center text-slate-800 relative z-10">
        <div className="w-full max-w-lg text-center space-y-6">
          <h2 className="text-3xl font-black bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent tracking-wider uppercase font-mono filter drop-shadow-sm animate-pulse">
            [ Running RF Diagnostic Scan ]
          </h2>
          
          <div className="w-full">
            <BrainScene isScanning={true} scanDuration={4000} />
          </div>

          <div className="space-y-2 text-[#6B7280] text-xs font-mono">
            <p className="animate-pulse">[ ALIGNING COGNITIVE DATA SETS ]</p>
            <p className="opacity-75">[ RUNNING CROSS-VALIDATION MATRIX ]</p>
            <p className="opacity-50">[ DETECTING CEREBRAL SUB-SECTOR INDICATORS ]</p>
          </div>
        </div>
      </div>
    );
  }

  const activeScores = {
    reading: getScoreFromTestResults('reading'),
    writing: getScoreFromTestResults('writing'),
    math: getScoreFromTestResults('math'),
    attention: getScoreFromTestResults('puzzle')
  };

  return (
    <div className="min-h-screen p-6 relative z-10 max-w-5xl mx-auto w-full flex flex-col gap-6 text-slate-600">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent mb-2 filter drop-shadow-sm">
          Assessment Results
        </h1>
        <p className="text-slate-500 font-bold">Comprehensive learning capability report</p>
      </motion.div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* ===== PREDICTION DIAGNOSIS CARD ===== */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-gradient-to-r ${getDisabilityColor(
              prediction.predicted_disability
            )} rounded-3xl shadow-2xl p-8 text-white border border-white/10 backdrop-blur-md bg-opacity-90`}
          >
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-widest text-purple-250">[ Machine Learning Diagnosis ]</span>
              <h2 className="text-5xl font-black mt-3 mb-6 filter drop-shadow-md">{prediction.predicted_disability}</h2>
              
              <div className="grid grid-cols-3 max-w-lg mx-auto gap-4 bg-[#2D1B69]/40 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/10">
                <div>
                  <p className="text-purple-200 text-xs font-bold uppercase tracking-wider">Disability Prob</p>
                  <p className="text-2xl font-black mt-1">{getPercentageScore(prediction.severity_percentage).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs font-bold uppercase tracking-wider">Severity Level</p>
                  <p className="text-2xl font-black mt-1">{prediction.severity_level || 'None'}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs font-bold uppercase tracking-wider">Confidence</p>
                  <p className="text-2xl font-black mt-1">{getPercentageScore(prediction.confidence_score).toFixed(1)}%</p>
                </div>
              </div>
              
              <p className="text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed font-bold">
                {prediction.reasoning}
              </p>
            </div>
          </motion.div>
        )}

        {/* ===== PERSONALIZED RECOMMENDATIONS ENGINE ===== */}
        {prediction && prediction.recommendations && prediction.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="text-4xl filter drop-shadow-sm">💡</span>
              <div>
                <h3 className="text-xl font-black text-[#2D1B69] tracking-tight">
                  Personalized Recommendations Engine
                </h3>
                <p className="text-xs text-[#6B7280] font-bold">Improvement strategies targeted to current cognitive profile</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {prediction.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-3 items-start p-4 bg-purple-50 border border-purple-100 rounded-2xl shadow-sm animate-fadeIn">
                  <span className="text-[#6D28D9] text-lg font-bold">✓</span>
                  <span className="text-sm font-semibold text-[#4B5563] leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== ACCURACY PERFORMANCE CHART ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="card p-6"
        >
          <h3 className="text-xl font-black mb-4 text-[#2D1B69] tracking-tight">
            Accuracy Performance Chart
          </h3>
          <div className="w-full h-80 min-h-[300px]">
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(109, 40, 217, 0.08)' },
                    ticks: { color: '#6B7280' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#6B7280' }
                  }
                }
              }} 
            />
          </div>
        </motion.div>

        {/* ===== CHART & SCORES ACCORDION ===== */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Interactive 3D Neural Map */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="md:col-span-2 flex flex-col"
          >
            <BrainScene scores={activeScores} />
          </motion.div>

          {/* Test results quick metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Reading Test */}
            <div className="card flex justify-between items-center p-5">
              <div>
                <span className="text-xs text-[#6B7280] font-bold uppercase">Reading Score</span>
                <p className="text-2xl font-black text-[#8B5CF6] mt-0.5">
                  {getPercentageScore(getScoreFromTestResults('reading')).toFixed(1)}%
                </p>
              </div>
              <span className="text-2xl p-2 bg-purple-50 border border-purple-100 rounded-xl shadow-md">📖</span>
            </div>

            {/* Writing Test */}
            <div className="card flex justify-between items-center p-5">
              <div>
                <span className="text-xs text-[#6B7280] font-bold uppercase">Writing Score</span>
                <p className="text-2xl font-black text-[#6D28D9] mt-0.5">
                  {getPercentageScore(getScoreFromTestResults('writing')).toFixed(1)}%
                </p>
              </div>
              <span className="text-2xl p-2 bg-purple-50 border border-purple-100 rounded-xl shadow-md">✍️</span>
            </div>

            {/* Math Test */}
            <div className="card flex justify-between items-center p-5">
              <div>
                <span className="text-xs text-[#6B7280] font-bold uppercase">Math Score</span>
                <p className="text-2xl font-black text-[#2D1B69] mt-0.5">
                  {getPercentageScore(getScoreFromTestResults('math')).toFixed(1)}%
                </p>
              </div>
              <span className="text-2xl p-2 bg-purple-50 border border-purple-100 rounded-xl shadow-md">🧮</span>
            </div>

            {/* Puzzle/Logic Test */}
            <div className="card flex justify-between items-center p-5">
              <div>
                <span className="text-xs text-[#6B7280] font-bold uppercase">Puzzle/Logic Score</span>
                <p className="text-2xl font-black text-[#8B5CF6] mt-0.5">
                  {getPercentageScore(getScoreFromTestResults('puzzle')).toFixed(1)}%
                </p>
              </div>
              <span className="text-2xl p-2 bg-purple-50 border border-purple-100 rounded-xl shadow-md">🧩</span>
            </div>
          </motion.div>
        </div>

        {/* ===== READING FLUENCY & ACCURACY METRICS CARD ===== */}
        {(() => {
          const readingResult = allTestResults.find(r => r.test_type === 'reading');
          if (!readingResult) return null;
          
          const details = readingResult.details || {};
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-4xl filter drop-shadow-sm">🗣️</span>
                <div>
                  <h3 className="text-xl font-black text-[#2D1B69] tracking-tight">
                    Speech Reading Assessment Details
                  </h3>
                  <p className="text-xs text-[#6B7280] font-bold">Detailed speech-to-text alignment and reading fluency metrics</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-[#6B7280] text-xs font-bold uppercase">Accuracy</p>
                  <p className="text-2xl font-black text-[#8B5CF6] mt-1">{getPercentageScore(readingResult.reading_accuracy ?? readingResult.score ?? 0).toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-[#6B7280] text-xs font-bold uppercase">Fluency Score</p>
                  <p className="text-2xl font-black text-[#6D28D9] mt-1">{getPercentageScore(details.fluency_score ?? 0).toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-[#6B7280] text-xs font-bold uppercase">Reading WPM</p>
                  <p className="text-2xl font-black text-[#2D1B69] mt-1">{readingResult.reading_wpm ?? details.wpm ?? 0} WPM</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Norm: {details.expected_wpm ?? 80} WPM</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center shadow-sm">
                  <p className="text-[#6B7280] text-xs font-bold uppercase">Reading Severity</p>
                  <p className="text-2xl font-black text-[#6D28D9] mt-1">{readingResult.severity_score ?? details.severity_score ?? 'None'}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-extrabold text-[#2D1B69] mb-3">Pronunciation & Timing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-purple-50/50 p-3 rounded-2xl border border-purple-100 text-xs font-bold">
                      <span className="text-[#6B7280]">Pronunciation Score:</span>
                      <span className="text-[#2D1B69] font-black">{getPercentageScore(readingResult.pronunciation_score ?? details.pronunciation_score ?? 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-purple-50/50 p-3 rounded-2xl border border-purple-100 text-xs font-bold">
                      <span className="text-[#6B7280]">Time Taken / Ideal Time:</span>
                      <span className="text-[#2D1B69] font-black">{readingResult.actual_time ?? details.time_taken ?? 0}s / {readingResult.ideal_time ?? details.ideal_time ?? 0}s</span>
                    </div>
                    <div className="flex justify-between items-center bg-purple-50/50 p-3 rounded-2xl border border-purple-100 text-xs font-bold">
                      <span className="text-[#6B7280]">Reading Delay:</span>
                      <span className="text-[#2D1B69] font-black">{getPercentageScore(readingResult.delay_percentage ?? details.delay_pct ?? 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-extrabold text-[#2D1B69] mb-3">Word Decoding Analysis</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl text-center animate-fadeIn">
                      <p className="text-[#6B7280] text-[10px] font-black uppercase">Skipped</p>
                      <p className="text-base font-black text-[#2D1B69] mt-0.5">{readingResult.skipped_words ?? details.skipped_words ?? 0}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl text-center animate-fadeIn">
                      <p className="text-[#6B7280] text-[10px] font-black uppercase">Mispronounced</p>
                      <p className="text-base font-black text-[#6D28D9] mt-0.5">{readingResult.mispronounced_words ?? details.mispronounced_words ?? 0}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl text-center animate-fadeIn">
                      <p className="text-[#6B7280] text-[10px] font-black uppercase">Substituted</p>
                      <p className="text-base font-black text-[#8B5CF6] mt-0.5">{details.substituted_words ?? 0}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl text-center animate-fadeIn">
                      <p className="text-[#6B7280] text-[10px] font-black uppercase">Extra Words</p>
                      <p className="text-base font-black text-slate-500 mt-0.5">{details.extra_words ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {details.spoken_transcript && (
                <div className="mt-5 pt-4 border-t border-purple-100">
                  <p className="text-[#6B7280] text-xs font-black uppercase tracking-wider mb-2">Spoken Transcript Alignment:</p>
                  <p className="text-[#4B5563] text-sm font-bold italic bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                    "{details.spoken_transcript}"
                  </p>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* ===== COGNITIVE STRENGTH BARS ===== */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-6"
          >
            <h3 className="text-xl font-black text-[#2D1B69] mb-5 tracking-tight">Cognitive Strength Indicators</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Reading Indicator */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-[#4B5563]">Reading Accuracy & Fluency</span>
                  <span className="text-sm font-black text-[#8B5CF6]">{getPercentageScore(prediction.reading_indicator).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-100 border border-purple-200/50 rounded-full h-3">
                  <motion.div
                    className="bg-[#8B5CF6] h-3 rounded-full shadow-lg shadow-purple-500/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${getPercentageScore(prediction.reading_indicator)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Writing Indicator */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-[#4B5563]">Handwriting & Orthographic</span>
                  <span className="text-sm font-black text-[#6D28D9]">{getPercentageScore(prediction.writing_indicator).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-100 border border-purple-200/50 rounded-full h-3">
                  <motion.div
                    className="bg-[#6D28D9] h-3 rounded-full shadow-lg shadow-purple-650/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${getPercentageScore(prediction.writing_indicator)}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
              </div>

              {/* Math Indicator */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-[#4B5563]">Numerical & Logic Reasoning</span>
                  <span className="text-sm font-black text-[#2D1B69]">{getPercentageScore(prediction.math_indicator).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-100 border border-purple-200/50 rounded-full h-3">
                  <motion.div
                    className="bg-[#2D1B69] h-3 rounded-full shadow-lg shadow-purple-900/25"
                    initial={{ width: 0 }}
                    animate={{ width: `${getPercentageScore(prediction.math_indicator)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>

              {/* Logic Indicator */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-[#4B5563]">Spatial Pattern Recognition</span>
                  <span className="text-sm font-black text-[#8B5CF6]">{getPercentageScore(prediction.logic_indicator).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-100 border border-purple-200/50 rounded-full h-3">
                  <motion.div
                    className="bg-[#8B5CF6] h-3 rounded-full shadow-lg shadow-purple-500/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${getPercentageScore(prediction.logic_indicator)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== ACTION CONTROLS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewHistory}
            className="btn-secondary"
          >
            Return to Dashboard
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewAssessment}
            className="btn-primary"
          >
            New Assessment
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;
