import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import '../styles/TestPages.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const ReadingTestPage = () => {
  const navigate = useNavigate();
  const {
    authToken,
    currentAssessment,
    selectedStudent,
    showError,
    showSuccess,
    setIsLoading,
    nextAssessmentStep,
    updateTestResult,
  } = useAppContext();

  // Test states: 'before', 'reading', 'submitting'
  const [testState, setTestState] = useState('before'); 
  const [readingText, setReadingText] = useState('');
  const [readingItems, setReadingItems] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [expectedWpm, setExpectedWpm] = useState(80);
  const [idealTime, setIdealTime] = useState(60);

  // Speech & Audio States
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Audio recording references
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    if (!authToken || !currentAssessment || !selectedStudent) {
      navigate('/dashboard');
      return;
    }

    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      console.warn('Web Speech API is not supported in this browser.');
    }

    fetchReadingMaterial();

    return () => {
      stopAllRecordingAndTimers();
    };
  }, [authToken, currentAssessment, selectedStudent]);

  const stopAllRecordingAndTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Stop media recorder stream
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.error(e);
      }
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ========================================
  // API CALLS
  // ========================================

  const fetchReadingMaterial = async () => {
    setIsLoading(true);
    try {
      const age = selectedStudent.age;
      const studentId = selectedStudent.id;
      const response = await fetch(`${API_BASE_URL}/reading-text?age=${age}&student_id=${studentId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReadingText(data.text);
        setReadingItems(data.items || []);
        setDifficulty(data.difficulty);
        setExpectedWpm(data.expected_wpm || 80);
        setIdealTime(data.ideal_time || 60);
      } else {
        showError('Failed to load reading material');
      }
    } catch (error) {
      console.error('Error fetching reading material:', error);
      showError('Error loading reading material');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // SPEECH RECOGNITION AND RECORDING FLOW
  // ========================================

  const startReadingFlow = async () => {
    audioChunksRef.current = [];
    setSpokenTranscript('');
    setSecondsElapsed(0);

    try {
      // 1. Request microphone access & start MediaRecorder
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr) {
        console.warn('Microphone access denied. Falling back to simulator/silent mode.', micErr);
        setSpeechSupported(false);
        
        // Start timer and proceed to test
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setSecondsElapsed(prev => prev + 1);
        }, 1000);
        
        setIsRecording(false);
        setTestState('reading');
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200); // chunk every 200ms

      // 2. Start Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
          setSpokenTranscript(fullTranscript.trim());
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            showError('Microphone permission blocked by browser. Proceeding in silent/simulator mode.');
            setSpeechSupported(false);
          }
        };

        recognition.onend = () => {
          // If still recording, restart recognition to prevent timeout
          if (isRecording && testState === 'reading') {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart speech recognition:', e);
            }
          }
        };

        recognition.start();
      }

      // 3. Start timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);

      setIsRecording(true);
      setTestState('reading');
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      showError('Proceeding in silent/simulator mode.');
      setSpeechSupported(false);
      
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
      
      setIsRecording(false);
      setTestState('reading');
    }
  };

  const stopReadingFlow = async () => {
    setTestState('submitting');
    setIsRecording(false);
    
    const endTime = Date.now();
    const actualTime = startTimeRef.current 
      ? Math.round((endTime - startTimeRef.current) / 1000) 
      : secondsElapsed;

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }

    // Stop microphone stream
    let audioBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await new Promise((resolve) => {
        mediaRecorderRef.current.onstop = () => {
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          resolve();
        };
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      });
    }

    // Convert audio to base64
    let base64Audio = null;
    if (audioBlob && audioBlob.size > 0) {
      base64Audio = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          resolve(reader.result);
        };
      });
    }

    submitReadingTest(actualTime, base64Audio);
  };

  const submitReadingTest = async (actualTime, base64Audio, overrideText = null) => {
    setIsLoading(true);
    
    let finalSpokenText = overrideText !== null ? overrideText : spokenTranscript;

    try {
      const response = await fetch(`${API_BASE_URL}/tests/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          assessment_id: currentAssessment.id,
          original_text: readingText,
          spoken_text: finalSpokenText,
          actual_time: actualTime || 1,
          audio_base64: base64Audio
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const res = data.result;
        
        // Save results to app context
        updateTestResult('reading', { 
          score: res.score, 
          accuracy: res.reading_accuracy, 
          wpm: res.reading_wpm,
          details: res.details 
        });

        showSuccess('Reading assessment completed successfully!');
        
        // Transition to next test
        setTimeout(() => {
          nextAssessmentStep();
          navigate('/writing-test');
        }, 1500);
      } else {
        const errData = await response.json();
        showError(errData.error || 'Failed to submit reading assessment results');
        setTestState('reading');
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error submitting reading assessment:', error);
      showError('Network error submitting reading assessment');
      setTestState('reading');
      setIsRecording(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper formatting for seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ========================================
  // RENDERING FUNCTIONS
  // ========================================

  if (testState === 'before') {
    return (
      <div className="min-h-screen pt-28 pb-10 px-6 flex items-center justify-center relative z-10 text-slate-600">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="card p-8 text-center">
            <div className="text-7xl mb-6 filter drop-shadow-md">🎙️</div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent mb-2 filter drop-shadow-sm">Reading Assessment</h1>
            <p className="text-slate-500 font-bold mb-6">
              A speech-to-text fluency and pronunciation analysis
            </p>

            <div className="bg-purple-50 rounded-2xl p-6 mb-8 text-left border border-purple-100">
              <h3 className="font-extrabold text-[#2D1B69] mb-3 flex items-center gap-2">
                <span>📋</span> Instructions:
              </h3>
              <ul className="space-y-3 text-[#4B5563] font-bold text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#6D28D9] font-bold">1.</span>
                  <span>Allow microphone access when prompted by the browser.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6D28D9] font-bold">2.</span>
                  <span>Click <strong>Start Reading</strong> and read the text shown aloud, clearly and naturally.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6D28D9] font-bold">3.</span>
                  <span>Click <strong>Stop & Submit</strong> once you have finished reading all the words.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#6D28D9] font-bold">4.</span>
                  <span>Our speech recognition and alignment AI will analyze your reading speed, pronunciation, and accuracy.</span>
                </li>
              </ul>
            </div>

            {!speechSupported && (
              <div className="bg-purple-50 border border-purple-200/50 text-[#6D28D9] rounded-2xl p-4 mb-6 text-sm font-bold flex items-center gap-2 backdrop-blur-sm animate-fadeIn">
                <span>⚠️</span>
                <span>Web Speech API is not supported. Running in simulator mode. The app will submit your text automatically.</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startReadingFlow}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
            >
              <span>Start Reading Assessment</span>
              <span>→</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 relative z-10 text-slate-605">
      <div className="max-w-4xl mx-auto">
        {/* Timer and Waveform Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-6 flex flex-wrap justify-between items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-5 h-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6]/70 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8B5CF6]"></span>
            </div>
            <p className="text-[#2D1B69] font-bold tracking-wide">Recording Active</p>
          </div>

          {/* Simulated Audio Waveform */}
          <div className="flex-1 max-w-xs h-6 flex items-center justify-center gap-1">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isRecording 
                    ? [8, Math.max(8, Math.floor(Math.random() * 26)), 8] 
                    : 8
                }}
                transition={{
                  duration: 0.4 + (i * 0.05),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-1 bg-gradient-to-t from-[#5B21B6] to-[#8B5CF6] rounded-full"
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-[#6B7280] text-xs font-black uppercase text-right">Elapsed Time</p>
              <p className="text-xl font-black text-[#8B5CF6] font-mono">{formatTime(secondsElapsed)}</p>
            </div>
            <div>
              <p className="text-[#6B7280] text-xs font-black uppercase text-right">Ideal Time</p>
              <p className="text-xl font-black text-[#6B7280] font-mono">{formatTime(idealTime)}</p>
            </div>
          </div>
        </motion.div>

        {/* Content Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 mb-8"
        >
          {readingItems && readingItems.length > 0 ? (
            // Age 5-7 Card Grid Layout
            <div>
              <p className="text-[#6B7280] text-xs font-black uppercase tracking-wider mb-6 text-center">
                👶 Read these Letters, Numbers, and Words out loud:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {readingItems.map((item, index) => {
                  let borderStyle = "border-purple-100 bg-purple-50 text-[#8B5CF6]";
                  if (item.type === 'number') {
                    borderStyle = "border-purple-150 bg-purple-50/80 text-[#6D28D9]";
                  } else if (item.type === 'word') {
                    borderStyle = "border-purple-200 bg-purple-50/60 text-[#2D1B69]";
                  }

                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      className={`border rounded-2xl p-6 text-center shadow-sm flex flex-col justify-center items-center gap-3 backdrop-blur-sm ${borderStyle}`}
                    >
                      {item.emoji ? (
                        <span className="text-5xl filter drop-shadow-sm">{item.emoji}</span>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-widest text-[#6B7280]">
                          {item.type}
                        </span>
                      )}
                      <span className="text-3xl font-black text-[#2D1B69]">{item.value}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Age 8+ Standard Passage Layout
            <div>
              <p className="text-[#6B7280] text-xs font-black uppercase tracking-wider mb-6 text-center">
                📖 Read the passage below out loud:
              </p>
              <div className="prose max-w-none px-4 py-2">
                <p className="text-2xl leading-relaxed text-[#2D1B69] font-serif text-center font-medium antialiased">
                  {readingText}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Live Transcription Preview */}
        {spokenTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-50 border border-purple-100 rounded-3xl p-5 mb-8"
          >
            <p className="text-[#6B7280] text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🎤</span> Live Transcription (Spoken Text):
            </p>
            <p className="text-[#4B5563] font-bold italic">
              "... {spokenTranscript} ..."
            </p>
          </motion.div>
        )}

        {/* Submit controls */}
        {!speechSupported ? (
          <div className="card p-6 border border-purple-200 bg-purple-50/50 text-center">
            <h3 className="text-lg font-black text-[#2D1B69] mb-4 flex items-center justify-center gap-2">
              🤖 Simulator Mode: Select Reading Behavior
            </h3>
            <p className="text-slate-500 font-bold text-sm mb-6">
              Web Speech API / Microphone is not supported. Choose a reading profile to submit:
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => submitReadingTest(secondsElapsed || 30, null, readingText)}
                disabled={testState === 'submitting'}
                className="px-6 py-3 bg-[#6D28D9] text-white rounded-2xl font-black shadow hover:brightness-110 transition-all text-sm disabled:opacity-50"
              >
                🟢 Perfect Reading (100% Accuracy)
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const words = readingText.split(' ');
                  const dyslexiaSpoken = words
                    .map((w, idx) => (idx % 3 === 0 ? w + "m" : idx % 5 === 0 ? "" : w))
                    .filter(Boolean)
                    .slice(0, Math.floor(words.length * 0.45))
                    .join(' ');
                  submitReadingTest(secondsElapsed || 60, null, dyslexiaSpoken);
                }}
                disabled={testState === 'submitting'}
                className="px-6 py-3 bg-[#8B5CF6] text-white rounded-2xl font-black shadow hover:brightness-110 transition-all text-sm disabled:opacity-50"
              >
                🟡 Reading with Errors (Dyslexia Profile)
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => submitReadingTest(secondsElapsed || 10, null, "")}
                disabled={testState === 'submitting'}
                className="px-6 py-3 bg-[#4C1D95] text-white rounded-2xl font-black shadow hover:brightness-110 transition-all text-sm disabled:opacity-50"
              >
                🔴 Skip / Did Not Read (0% Accuracy)
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopReadingFlow}
              disabled={testState === 'submitting'}
              className="px-10 py-4 bg-gradient-to-r from-[#5B21B6] via-[#8B5CF6] to-[#C4B5FD] hover:brightness-110 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all text-lg flex items-center gap-2 disabled:opacity-50 border border-purple-200/50"
            >
              <span>Stop & Submit Reading</span>
              <span>✓</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingTestPage;
