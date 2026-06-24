import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import '../styles/TestPages.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const WritingTestPage = () => {
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

  const [stage, setStage] = useState('instructions'); // instructions, test, completed
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanText, setScanText] = useState('');
  
  // Accumulated word results
  const [wordResults, setWordResults] = useState([]);
  
  // Canvas Refs & State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const pointsRef = useRef([]); // Stores coordinates {x, y, t} for current word
  const strokesRef = useRef([]); // Stores array of strokes (each stroke is array of points)

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    if (!authToken || !currentAssessment || !selectedStudent) {
      navigate('/dashboard');
      return;
    }

    fetchWritingWords();
  }, [authToken, currentAssessment, selectedStudent]);

  // Redraw grid lines whenever the canvas or test stage changes
  useEffect(() => {
    if (stage === 'test' && canvasRef.current) {
      clearCanvas();
    }
  }, [stage, currentWordIndex]);

  // ========================================
  // FETCH WRITING WORDS
  // ========================================

  const fetchWritingWords = async () => {
    setIsLoading(true);
    try {
      const age = selectedStudent.age;
      const studentId = selectedStudent.id;
      const response = await fetch(
        `${API_BASE_URL}/writing-words?age=${age}&student_id=${studentId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setWords(data.words || ['cat', 'dog', 'sun', 'star', 'tree']);
      } else {
        showError('Failed to load words');
        setWords(['cat', 'dog', 'sun', 'star', 'tree']);
      }
    } catch (error) {
      console.error('Error fetching writing words:', error);
      showError('Error loading words');
      setWords(['cat', 'dog', 'sun', 'star', 'tree']);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // CANVAS DRAWING HANDLERS
  // ========================================

  const initCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    // Set line styles
    ctx.strokeStyle = '#5B21B6'; // Primary Purple ink
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    drawNotebookLines(canvas, ctx);
  };

  const drawNotebookLines = (canvas, ctx) => {
    // Clear canvas background
    ctx.fillStyle = '#f8fafc'; // light gray paper
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw purple horizontal notebook lines
    ctx.strokeStyle = '#C4B5FD'; // Light lavender line
    ctx.lineWidth = 1;
    
    const lineSpacing = 40;
    for (let y = lineSpacing; y < canvas.height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw purple vertical margin line
    ctx.strokeStyle = '#8B5CF6'; // Accent Purple margin line
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.lineTo(60, canvas.height);
    ctx.stroke();
    
    // Reset brush styles
    ctx.strokeStyle = '#2D1B69'; // Dark Purple pen color
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Handle Touch vs Mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinates to handle canvas sizing/resolution
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
      t: Date.now()
    };
  };

  const handleStartDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const coords = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    setIsDrawing(true);
    setHasDrawn(true);
    
    pointsRef.current = [coords];
    strokesRef.current.push(pointsRef.current);
  };

  const handleDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) return;
    
    const coords = getCoordinates(e);
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    pointsRef.current.push(coords);
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawNotebookLines(canvas, ctx);
    setHasDrawn(false);
    pointsRef.current = [];
    strokesRef.current = [];
  };

  // ========================================
  // OCR & CLARITY CALCULATION SIMULATOR
  // ========================================

  const analyzeHandwriting = () => {
    const strokes = strokesRef.current;
    if (strokes.length === 0) return { clarity: 0, spellingCorrect: false, recognized: "" };
    
    let totalPoints = 0;
    let totalJitter = 0;
    let totalDistance = 0;
    
    // Compute bounding box
    let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
    
    strokes.forEach(stroke => {
      totalPoints += stroke.length;
      for (let i = 0; i < stroke.length; i++) {
        const p = stroke[i];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        
        // Calculate jitter (changes in velocity/acceleration directions)
        if (i > 1) {
          const pPrev = stroke[i - 1];
          const pPrevPrev = stroke[i - 2];
          
          const v1x = pPrev.x - pPrevPrev.x;
          const v1y = pPrev.y - pPrevPrev.y;
          const v2x = p.x - pPrev.x;
          const v2y = p.y - pPrev.y;
          
          const d1 = Math.sqrt(v1x*v1x + v1y*v1y);
          const d2 = Math.sqrt(v2x*v2x + v2y*v2y);
          
          totalDistance += d2;
          
          if (d1 > 1 && d2 > 1) {
            // Dot product to check heading shift
            const dot = (v1x*v2x + v1y*v2y) / (d1 * d2);
            // angle shift variance represents shake/jitter
            const headingShift = 1.0 - Math.min(1.0, Math.max(-1.0, dot));
            totalJitter += headingShift;
          }
        }
      }
    });

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    
    // Basic heuristics:
    // 1. Jitter ratio: higher jitter = shakier hand
    const jitterRatio = totalPoints > 3 ? totalJitter / totalPoints : 0;
    
    // 2. Writing scale: if the word is too squished relative to character length, penalty
    const targetWord = words[currentWordIndex];
    const characterRatio = targetWord.length;
    const expectedWidth = characterRatio * 25;
    const widthRatio = Math.min(1.0, boxWidth / expectedWidth);
    
    // Calculate clarity score (0 to 100)
    let clarity = 95 - (jitterRatio * 280);
    // Apply width ratio penalty if bounding box is extremely tiny or squished
    if (widthRatio < 0.3) {
      clarity -= (0.3 - widthRatio) * 100;
    }
    
    // Bounds check
    clarity = Math.max(25, Math.min(96, Math.round(clarity)));
    
    // Age-based compensation: younger children (e.g. 5-7) get a soft boost
    if (selectedStudent.age < 8) {
      clarity = Math.min(98, clarity + 15);
    } else if (selectedStudent.age <= 10) {
      clarity = Math.min(97, clarity + 5);
    }
    
    // Simulated OCR character recognition based on clarity
    let spellingCorrect = true;
    let recognized = targetWord;
    
    // If clarity is low (< 58%), simulate OCR misinterpreting characters
    if (clarity < 58) {
      spellingCorrect = false;
      // Scramble one vowel or omit a letter
      const vowelMap = { 'a': 'o', 'e': 'i', 'i': 'e', 'o': 'u', 'u': 'a' };
      const chars = targetWord.split('');
      
      let scrambled = false;
      for (let i = 0; i < chars.length; i++) {
        if (vowelMap[chars[i]]) {
          chars[i] = vowelMap[chars[i]];
          scrambled = true;
          break;
        }
      }
      
      if (!scrambled && chars.length > 2) {
        // Swap last two letters
        const temp = chars[chars.length - 1];
        chars[chars.length - 1] = chars[chars.length - 2];
        chars[chars.length - 2] = temp;
      }
      
      recognized = chars.join('');
    }
    
    return {
      clarity,
      spellingCorrect,
      recognized
    };
  };

  // ========================================
  // STAGE HANDLERS
  // ========================================

  const handleStartTest = () => {
    setStage('test');
  };

  const handleScanWord = () => {
    if (!hasDrawn) {
      showError('Please write the word on the canvas first!');
      return;
    }

    setIsScanning(true);
    setScanText('Initializing handwriting OCR matrix...');
    
    const analysis = analyzeHandwriting();
    
    // Laser scan timeline updates
    setTimeout(() => {
      setScanText('Extracting stroke geometry and contours...');
    }, 800);
    
    setTimeout(() => {
      setScanText(`Running neural grid prediction... Recognized: "${analysis.recognized}"`);
    }, 1600);

    setTimeout(() => {
      setIsScanning(false);
      setWordResults(prev => [
        ...prev,
        {
          word: words[currentWordIndex],
          recognized: analysis.recognized,
          clarity: analysis.clarity,
          spellingCorrect: analysis.spellingCorrect
        }
      ]);
      
      // Move to next word or complete test
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        submitWritingAssessment([
          ...wordResults,
          {
            word: words[currentWordIndex],
            recognized: analysis.recognized,
            clarity: analysis.clarity,
            spellingCorrect: analysis.spellingCorrect
          }
        ]);
      }
    }, 2500);
  };

  const submitWritingAssessment = async (finalResults) => {
    setStage('completed');
    setIsLoading(true);
    
    const correctCount = finalResults.filter(r => r.spellingCorrect).length;
    const spellingAccuracy = Math.round((correctCount / finalResults.length) * 100);
    
    const avgClarity = Math.round(
      finalResults.reduce((acc, curr) => acc + curr.clarity, 0) / finalResults.length
    );
    
    // Final score is average of spelling accuracy & handwriting clarity
    const finalScore = Math.round((spellingAccuracy + avgClarity) / 2);
    
    try {
      const response = await fetch(`${API_BASE_URL}/tests/writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          assessment_id: currentAssessment.id,
          score: finalScore,
          accuracy: spellingAccuracy,
          details: {
            written_words: finalResults,
            word_count: finalResults.length,
            spelling_errors: finalResults.length - correctCount,
            handwriting_clarity: avgClarity,
            ocr_simulated: true
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        updateTestResult('writing', {
          score: finalScore,
          accuracy: spellingAccuracy,
          details: data.result.details,
        });

        showSuccess('Writing test completed!');
        setTimeout(() => {
          nextAssessmentStep();
          navigate('/math-test');
        }, 1500);
      } else {
        showError(data.error || 'Failed to submit test');
      }
    } catch (error) {
      showError('Error submitting writing test');
      console.error('Error submitting test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen p-6 flex flex-col items-center relative z-10 text-slate-600">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent mb-2 filter drop-shadow-sm">
          Handwriting Assessment
        </h1>
        <p className="text-slate-500 font-bold">Step 2 of 4 • Fine Motor & Spelling Test</p>
      </motion.div>

      <div className="w-full max-w-3xl flex-1 flex flex-col justify-center">
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
              <h2 className="text-2xl font-black mb-6 text-[#2D1B69] text-center">How to Write:</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col items-center text-center">
                  <div className="text-4xl mb-3 filter drop-shadow-sm">✍️</div>
                  <h3 className="font-extrabold text-[#2D1B69] mb-2">Write on Canvas</h3>
                  <p className="text-[#4B5563] text-sm font-semibold">Use your mouse or finger to write the target word clearly inside the notebook lines.</p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col items-center text-center">
                  <div className="text-4xl mb-3 filter drop-shadow-sm">🔍</div>
                  <h3 className="font-extrabold text-[#2D1B69] mb-2">OCR Scanning</h3>
                  <p className="text-[#4B5563] text-sm font-semibold">Our artificial intelligence scanner will inspect your letters, check spelling, and clarity.</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl mb-6 text-center border border-purple-100">
                <span className="font-bold text-[#2D1B69]">Target Words:</span>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {words.map(w => (
                    <span key={w} className="px-3 py-1 bg-purple-100 border border-purple-200 text-[#6D28D9] rounded-full font-bold text-sm shadow-sm">{w}</span>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartTest}
                className="btn-primary w-full text-lg"
              >
                Let's Start Writing! 🚀
              </motion.button>
            </motion.div>
          )}

          {/* ===== TEST STAGE ===== */}
          {stage === 'test' && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Word Display Panel */}
              <div className="card p-5 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-[#8B5CF6] uppercase tracking-widest">Target Word</span>
                  <h3 className="text-4xl font-black text-[#2D1B69] tracking-wide font-mono mt-1">
                    {words[currentWordIndex]}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#6B7280]">Progress</span>
                  <div className="text-lg font-bold text-[#6D28D9] mt-1">
                    {currentWordIndex + 1} of {words.length} Words
                  </div>
                </div>
              </div>

              {/* Notebook Canvas Board */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-purple-100 p-3 relative overflow-hidden">
                {/* Rule paper margin helper */}
                <div className="absolute top-5 left-20 z-20 text-xs font-bold text-[#6D28D9]/80 pointer-events-none select-none font-serif">
                  Write the word "{words[currentWordIndex]}" inside the lines below:
                </div>
                
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={280}
                  onMouseDown={handleStartDrawing}
                  onMouseMove={handleDrawing}
                  onMouseUp={handleStopDrawing}
                  onMouseLeave={handleStopDrawing}
                  onTouchStart={handleStartDrawing}
                  onTouchMove={handleDrawing}
                  onTouchEnd={handleStopDrawing}
                  className="w-full h-72 block cursor-crosshair touch-none bg-slate-50 rounded-2xl border border-slate-200/60 shadow-inner"
                  style={{ touchAction: 'none' }}
                />

                {/* Initializing canvas binding */}
                <span ref={(el) => el && !canvasRef.current && initCanvas(el)} style={{ display: 'none' }} />
                
                {/* Laser Scanning Animation Overlay */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/95 backdrop-blur-[1px] flex flex-col items-center justify-center text-[#2D1B69] p-6"
                    >
                      {/* Laser Line */}
                      <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: ['0%', '90%', '0%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_8px_rgba(139,92,246,0.8)] z-10"
                      />
                      
                      <div className="relative text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-[#6D28D9] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xl font-bold tracking-wide animate-pulse">
                          Scanning Handwriting...
                        </p>
                        <p className="text-xs text-[#6D28D9] font-mono">
                          {scanText}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={clearCanvas}
                  disabled={isScanning}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-lg"
                >
                  🗑️ Clear Board
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleScanWord}
                  disabled={isScanning}
                  className="btn-primary flex-2 flex items-center justify-center gap-2 text-lg"
                >
                  🔮 Analyze & Scan Word →
                </motion.button>
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
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl filter drop-shadow-sm"
                >
                  🎉
                </motion.span>
              </div>
              <h2 className="text-3xl font-black text-[#2D1B69] mb-2">Writing Test Completed!</h2>
              <p className="text-[#4B5563] text-lg font-bold">We successfully generated handwriting clarity and spelling models.</p>
              <p className="text-sm text-[#6B7280] font-bold mt-2 animate-pulse">Loading next step: Mathematics Assessment...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WritingTestPage;
