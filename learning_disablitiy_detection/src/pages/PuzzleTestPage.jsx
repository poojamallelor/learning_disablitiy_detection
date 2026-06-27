import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import '../styles/TestPages.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const PuzzleTestPage = () => {
  const navigate = useNavigate();
  const {
    authToken,
    currentAssessment,
    selectedStudent,
    updateTestResult,
    nextAssessmentStep,
    showError,
    showSuccess,
    setIsLoading,
  } = useAppContext();

  const [stage, setStage] = useState('instructions'); // instructions, testing, completed
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Puzzle Timing state
  const [puzzleStartTime, setPuzzleStartTime] = useState(null);

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    if (!authToken || !currentAssessment || !selectedStudent) {
      navigate('/dashboard');
      return;
    }

    fetchPuzzleQuestions();
  }, [authToken, currentAssessment, selectedStudent]);

  // ========================================
  // FETCH PUZZLE QUESTIONS
  // ========================================

  const fetchPuzzleQuestions = async () => {
    setIsLoading(true);
    try {
      const age = selectedStudent.age;
      const studentId = selectedStudent.id;
      const response = await fetch(
        `${API_BASE_URL}/puzzle-questions?age=${age}&student_id=${studentId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions || []);
      } else {
        showError('Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching puzzle questions:', error);
      showError('Error loading questions');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // HANDLERS
  // ========================================

  const handleStartTest = () => {
    setStage('testing');
    setPuzzleStartTime(Date.now());
  };

  const handleAnswerChange = (answer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };

  const handleCheckAnswer = () => {
    const current = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];

    // Check if answer matches
    const isCorrect = current.correct === userAnswer || current.correct === parseInt(userAnswer);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('🎉 Correct! Excellent reasoning!');
    } else {
      setFeedback(`❌ Incorrect. The correct answer is: ${current.correct}`);
    }

    setShowFeedback(true);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setShowFeedback(false);
      } else {
        handleSubmitTest(isCorrect ? correctCount + 1 : correctCount);
      }
    }, 2000);
  };

  const handleSubmitTest = async (finalCorrectCount) => {
    setIsSubmitting(true);
    setIsLoading(true);

    const completionTime = Math.round((Date.now() - puzzleStartTime) / 1000); // total seconds

    try {
      const accuracy = questions.length > 0 ? (finalCorrectCount / questions.length) * 100 : 100;
      const puzzleScore = accuracy;

      const response = await fetch(`${API_BASE_URL}/tests/puzzle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          assessment_id: currentAssessment.id,
          score: puzzleScore,
          accuracy: accuracy,
          details: {
            correct_answers: finalCorrectCount,
            total_questions: questions.length,
            answers: userAnswers,
            completion_time: completionTime,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        updateTestResult('puzzle', {
          score: puzzleScore,
          accuracy: accuracy,
          details: data.result.details,
        });

        showSuccess('Puzzle test completed!');
        setStage('completed');

        setTimeout(() => {
          nextAssessmentStep();
          navigate('/results');
        }, 1500);
      } else {
        showError(data.error || 'Failed to submit test');
      }
    } catch (error) {
      showError('Error submitting test');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center relative z-10 text-slate-605">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent mb-2 filter drop-shadow-sm">
          Logic & Puzzles
        </h1>
        <p className="text-slate-500 font-bold">Step 4 of 4 • Reasoning & Sequences Test</p>
      </motion.div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {/* ===== INSTRUCTIONS STAGE ===== */}
          {stage === 'instructions' && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-8"
            >
              <h2 className="text-2xl font-black mb-6 text-[#2D1B69] text-center">Instructions:</h2>
              <div className="space-y-4 text-[#4B5563] mb-8">
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-3xl filter drop-shadow-sm">🧩</span>
                  <div>
                    <h3 className="font-extrabold text-[#2D1B69]">Solve Patterns</h3>
                    <p className="text-sm text-[#4B5563] font-semibold">Complete logic grids, letter sequences, and relational questions.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-3xl filter drop-shadow-sm">⏱️</span>
                  <div>
                    <h3 className="font-extrabold text-[#2D1B69]">Time Completion</h3>
                    <p className="text-sm text-[#4B5563] font-semibold">The total duration to complete the puzzle block is recorded.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-3xl filter drop-shadow-sm">🎯</span>
                  <div>
                    <h3 className="font-extrabold text-[#2D1B69]">Double Check</h3>
                    <p className="text-sm text-[#4B5563] font-semibold">Think before you choose - reasoning accuracy is critical!</p>
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartTest}
                className="btn-primary w-full text-lg"
              >
                Start Puzzle Test! 🚀
              </motion.button>
            </motion.div>
          )}

          {/* ===== TESTING STAGE ===== */}
          {stage === 'testing' && currentQuestion && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Progress Card */}
              <div className="card p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-[#6B7280]">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="px-3 py-1 bg-purple-50 text-[#6D28D9] rounded-full text-xs font-bold border border-purple-100">
                    ✓ Correct: {correctCount}
                  </span>
                </div>
                <div className="w-full bg-purple-100 border border-purple-200/50 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-[#5B21B6] to-[#8B5CF6] h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="card p-8">
                <h3 className="text-2xl font-black text-center text-[#2D1B69] mb-8 leading-relaxed">
                  {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 gap-3 mb-8">
                  {currentQuestion.options && currentQuestion.options.map((option, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAnswerChange(option)}
                      disabled={showFeedback}
                      className={`p-4 rounded-2xl font-black text-left border transition-all ${
                        userAnswers[currentQuestionIndex] === option
                          ? 'bg-gradient-to-r from-[#5B21B6] to-[#8B5CF6] text-white border-transparent shadow-lg shadow-purple-500/25'
                          : 'bg-purple-50 border-purple-100 text-slate-700 hover:bg-purple-100/50 backdrop-blur-sm'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {!showFeedback ? (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={handleCheckAnswer}
                      disabled={!userAnswers[currentQuestionIndex]}
                      className="btn-primary w-full text-lg disabled:opacity-50"
                    >
                      Check Answer ✓
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-5 rounded-2xl border ${
                        feedback.includes('Correct')
                          ? 'bg-purple-50 border-purple-250/50 text-[#6D28D9]'
                          : 'bg-purple-50 border-purple-150 text-[#2D1B69]'
                      } backdrop-blur-sm`}
                    >
                      <p className="font-bold text-lg">{feedback}</p>
                      {currentQuestion.explanation && (
                        <p className="text-sm mt-2 text-[#6B7280] font-semibold leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ===== COMPLETED STAGE ===== */}
          {stage === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-8 text-center"
            >
              <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-100">
                <span className="text-4xl filter drop-shadow-sm">🏆</span>
              </div>
              <h2 className="text-3xl font-black text-[#2D1B69] mb-2">Puzzle Test Completed!</h2>
              <p className="text-[#4B5563] text-lg font-bold">
                Awesome! You finished the entire assessment battery.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PuzzleTestPage;
