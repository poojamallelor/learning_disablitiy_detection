import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ============================================================================
// GLOBAL RESILIENT BACKEND MOCK INTERCEPTOR
// ============================================================================
// Automatically detects if the Flask backend (http://localhost:5000) is offline.
// If offline, it intercepts all API calls and handles them locally in-browser
// with persistence in localStorage. This prevents net::ERR_CONNECTION_REFUSED
// console errors and allows full end-to-end sandbox testing without the backend.
// ============================================================================
(function () {
  const originalFetch = window.fetch;
  // Always default to false to allow initial requests to go to the real backend
  let backendOffline = false;

  // Silent asynchronous ping to the health endpoint to detect server status
  originalFetch('http://127.0.0.1:5000/api/health')
    .then((res) => {
      if (res.ok) {
        backendOffline = false;
        localStorage.setItem('backend_offline', 'false');
      } else {
        backendOffline = true;
        localStorage.setItem('backend_offline', 'true');
      }
    })
    .catch(() => {
      // If server is not reachable, activate mock server
      backendOffline = true;
      localStorage.setItem('backend_offline', 'true');
    });

  window.fetch = async function (url, options) {
    const urlString = typeof url === 'string' ? url : (url.url || '');

    // Check if targeting the backend server
    if (urlString.includes('127.0.0.1:5000/api') || urlString.includes('localhost:5000/api') || urlString.startsWith('/api') || urlString.includes(':5000/api')) {
      if (backendOffline) {
        return handleMockRequest(urlString, options);
      }

      try {
        const response = await originalFetch(url, options);
        return response;
      } catch (err) {
        console.warn('[LearnAI Mock Server] Connection refused. Falling back to local mock server.');
        backendOffline = true;
        localStorage.setItem('backend_offline', 'true');
        return handleMockRequest(urlString, options);
      }
    }

    return originalFetch(url, options);
  };

  function handleMockRequest(url, options) {
    const method = ((options && options.method) || 'GET').toUpperCase();
    const bodyStr = (options && options.body) || '';

    let path = url;
    if (url.includes('http://127.0.0.1:5000')) {
      path = url.split('http://127.0.0.1:5000')[1];
    } else if (url.includes('http://localhost:5000')) {
      path = url.split('http://localhost:5000')[1];
    } else if (url.includes(':5000')) {
      path = url.split(':5000')[1];
    }

    const pathNoQuery = path.split('?')[0];
    let responseData = {};
    let status = 200;

    console.log(`%c[LearnAI Mock Server]%c Intercepted ${method} -> ${pathNoQuery}`, 'color: #a855f7; font-weight: bold;', 'color: #3b82f6;');

    if (pathNoQuery.endsWith('/auth/google-login')) {
      let email = 'jane.doe@gmail.com';
      let name = 'Jane Doe';
      try {
        const parsed = JSON.parse(bodyStr);
        email = parsed.email || email;
        name = parsed.full_name || name;
      } catch (e) {}

      responseData = {
        token: 'mock-jwt-token-xyz',
        user: {
          id: 1,
          username: email.split('@')[0],
          email: email,
          full_name: name,
          role: 'parent'
        }
      };
    } else if (pathNoQuery.endsWith('/auth/logout')) {
      responseData = { status: 'success', message: 'Logged out successfully' };
    } else if (pathNoQuery.endsWith('/students')) {
      if (method === 'GET') {
        let students = JSON.parse(localStorage.getItem('mock_students') || '[]');
        if (students.length === 0) {
          students = [
            { id: 1, name: 'Timmy Doe', age: 8, grade: '3rd Grade', user_id: 1 }
          ];
          localStorage.setItem('mock_students', JSON.stringify(students));
        }
        responseData = { students };
      } else {
        let name = 'Timmy Doe';
        let age = 8;
        let grade = '3rd Grade';
        try {
          const parsed = JSON.parse(bodyStr);
          name = parsed.name || name;
          age = parseInt(parsed.age) || age;
          grade = parsed.grade || grade;
        } catch (e) {}

        let students = JSON.parse(localStorage.getItem('mock_students') || '[]');
        const newStudent = {
          id: Date.now(),
          name,
          age,
          grade,
          user_id: 1
        };
        students.push(newStudent);
        localStorage.setItem('mock_students', JSON.stringify(students));
        responseData = { status: 'success', student: newStudent };
      }
    } else if (pathNoQuery.includes('/students/')) {
      const parts = pathNoQuery.split('/');
      const studentId = parseInt(parts[parts.length - 1]);
      let students = JSON.parse(localStorage.getItem('mock_students') || '[]');
      const student = students.find((s) => s.id === studentId) || { id: studentId, name: 'Timmy Doe', age: 8, grade: '3rd Grade' };
      responseData = { student };
    } else if (pathNoQuery.endsWith('/assessments/start')) {
      let studentId = 1;
      try {
        const parsed = JSON.parse(bodyStr);
        studentId = parsed.student_id || studentId;
      } catch (e) {}
      const newAssessment = {
        id: Date.now(),
        student_id: studentId,
        start_time: new Date().toISOString(),
        status: 'in_progress'
      };
      localStorage.setItem('mock_current_assessment', JSON.stringify(newAssessment));
      responseData = { status: 'success', assessment: newAssessment };
    } else if (pathNoQuery.endsWith('/reading-text')) {
      const query = url.split('?')[1] || '';
      const params = new URLSearchParams(query);
      const age = parseInt(params.get('age') || '8');

      if (age < 8) {
        responseData = {
          text: 'The fat cat sat on the red mat. A big dog ran in the sun.',
          items: [
            { value: 'A', type: 'letter', emoji: '🍎' },
            { value: 'B', type: 'letter', emoji: '🎈' },
            { value: '7', type: 'number', emoji: '🎲' },
            { value: 'cat', type: 'word', emoji: '🐱' },
            { value: 'dog', type: 'word', emoji: '🐶' }
          ],
          difficulty: 'easy',
          expected_wpm: 50,
          ideal_time: 45
        };
      } else {
        responseData = {
          text: 'The mysterious spaceship landed silently in the deep green forest. A small blue creature stepped outside holding a glowing star.',
          items: [],
          difficulty: 'medium',
          expected_wpm: 90,
          ideal_time: 60
        };
      }
    } else if (pathNoQuery.endsWith('/tests/reading')) {
      let score = 85;
      try {
        const parsed = JSON.parse(bodyStr);
        const actualTime = parsed.actual_time || 40;
        score = actualTime > 50 ? 70 : 88;
      } catch (e) {}

      responseData = {
        status: 'success',
        result: {
          score: score,
          reading_accuracy: score + 4,
          reading_wpm: 82,
          details: { mispronounced_words: 1, skipped_words: 0 }
        }
      };
      saveMockTestResult('reading', responseData.result);
    } else if (pathNoQuery.endsWith('/writing-words')) {
      const query = url.split('?')[1] || '';
      const params = new URLSearchParams(query);
      const age = parseInt(params.get('age') || '8');

      if (age < 8) {
        responseData = { words: ['cat', 'dog', 'sun', 'box', 'run'] };
      } else {
        responseData = { words: ['science', 'galaxy', 'written', 'school', 'nature'] };
      }
    } else if (pathNoQuery.endsWith('/tests/writing')) {
      let score = 80;
      let accuracy = 85;
      let details = {};
      try {
        const parsed = JSON.parse(bodyStr);
        score = parsed.score || score;
        accuracy = parsed.accuracy || accuracy;
        details = parsed.details || details;
      } catch (e) {}

      responseData = {
        status: 'success',
        result: {
          score,
          accuracy,
          details: {
            ...details,
            ocr_simulated: true
          }
        }
      };
      saveMockTestResult('writing', responseData.result);
    } else if (pathNoQuery.endsWith('/math-questions')) {
      const query = url.split('?')[1] || '';
      const params = new URLSearchParams(query);
      const age = parseInt(params.get('age') || '8');

      if (age < 8) {
        responseData = {
          questions: [
            { question: '2 + 3 = ?', options: [4, 5, 6, 7], correct: 5, metadata: { '4': 'calculation slip', '6': 'calculation slip' } },
            { question: '5 - 2 = ?', options: [2, 3, 4, 5], correct: 3 },
            { question: '10 + 4 = ?', options: [12, 13, 14, 15], correct: 14 }
          ]
        };
      } else {
        responseData = {
          questions: [
            { question: '12 + 15 = ?', options: [25, 27, 28, 30], correct: 27 },
            { question: '24 - 9 = ?', options: [13, 15, 17, 19], correct: 15 },
            { question: '7 x 8 = ?', options: [54, 56, 58, 60], correct: 56 }
          ]
        };
      }
    } else if (pathNoQuery.endsWith('/tests/math')) {
      let score = 90;
      let accuracy = 90;
      let details = {};
      try {
        const parsed = JSON.parse(bodyStr);
        score = parsed.score || score;
        accuracy = parsed.accuracy || accuracy;
        details = parsed.details || details;
      } catch (e) {}

      responseData = {
        status: 'success',
        result: {
          score,
          accuracy,
          details
        }
      };
      saveMockTestResult('math', responseData.result);
    } else if (pathNoQuery.endsWith('/puzzle-questions')) {
      responseData = {
        questions: [
          { question: 'Complete the sequence: 2, 4, 8, 16, ?', options: ['20', '24', '32', '64'], correct: '32', explanation: 'Each number is double the previous one.' },
          { question: 'Complete the sequence: A, C, E, G, ?', options: ['H', 'I', 'J', 'K'], correct: 'I', explanation: 'Letters skip one place each time.' },
          { question: 'If red is color, apple is ?', options: ['Fruit', 'Vegetable', 'Tree', 'Leaf'], correct: 'Fruit', explanation: 'Apple is classified as a fruit.' }
        ]
      };
    } else if (pathNoQuery.endsWith('/tests/puzzle')) {
      let score = 85;
      let accuracy = 85;
      let details = {};
      try {
        const parsed = JSON.parse(bodyStr);
        score = parsed.score || score;
        accuracy = parsed.accuracy || accuracy;
        details = parsed.details || details;
      } catch (e) {}

      responseData = {
        status: 'success',
        result: {
          score,
          accuracy,
          details
        }
      };
      saveMockTestResult('puzzle', responseData.result);
    } else if (pathNoQuery.endsWith('/results/analyze')) {
      const mockResults = JSON.parse(localStorage.getItem('mock_results_store') || '{}');
      const readingScore = mockResults.reading ? mockResults.reading.score : 85;
      const writingScore = mockResults.writing ? mockResults.writing.score : 80;
      const mathScore = mockResults.math ? mockResults.math.score : 90;
      const puzzleScore = mockResults.puzzle ? mockResults.puzzle.score : 85;

      let predictedDisability = 'No Learning Disability Detected';
      let severityPercentage = 10;
      let severityLevel = 'None';
      let reasoning = 'The student demonstrated consistent proficiency across all assessment parameters.';
      let recommendations = [
        'Encourage read-aloud activities to maintain pronunciation clarity.',
        'Foster creative writing exercises to further spelling complexity.',
        'Solve logic puzzles together to build arithmetic speed.'
      ];

      if (readingScore < 60) {
        predictedDisability = 'Dyslexia';
        severityPercentage = 76.5;
        severityLevel = 'Moderate';
        reasoning = 'Phonological decoding and pronunciation speed are below average guidelines for the grade level.';
        recommendations = [
          'Use structured multisensory literacy program (e.g. Orton-Gillingham).',
          'Utilize colored overlays or specialized fonts (Dyslexie/OpenDyslexic).',
          'Incorporate audiobooks matching text passages to reinforce sight-word links.'
        ];
      } else if (writingScore < 60) {
        predictedDisability = 'Dysgraphia';
        severityPercentage = 68.2;
        severityLevel = 'Moderate';
        reasoning = 'Handwriting orthographic precision and fine-motor spacing are below expected age parameters.';
        recommendations = [
          'Adopt wide-ruled notebook paper with raised line bounds.',
          'Introduce typing instruction and speech-to-text dictation assistance.',
          'Integrate occupational therapy fine-motor warmups (e.g. clay squeeze).'
        ];
      } else if (mathScore < 60) {
        predictedDisability = 'Dyscalculia';
        severityPercentage = 82.4;
        severityLevel = 'High';
        reasoning = 'Concept quantity representation and arithmetic synthesis times indicate severe calculation difficulty.';
        recommendations = [
          'Leverage physical manipulatives (Cuisenaire rods, base-ten blocks).',
          'Allow graph paper use to vertically align numbers during columns math.',
          'Provide extra reference sheets (times tables, math step lists.'
        ];
      } else if (puzzleScore < 60) {
        predictedDisability = 'ADHD';
        severityPercentage = 62.0;
        severityLevel = 'Mild';
        reasoning = 'Logic sequence processing times show high attention drift and focus inconsistency.';
        recommendations = [
          'Segment test sessions into brief 10-minute active blocks.',
          'Provide a quiet workspace free of visual distractions.',
          'Incorporate check-lists to structure multi-step tasks.'
        ];
      }

      const analysisPrediction = {
        predicted_disability: predictedDisability,
        severity_percentage: severityPercentage,
        severity_level: severityLevel,
        confidence_score: 0.94,
        reasoning,
        recommendations
      };

      const currentAss = JSON.parse(localStorage.getItem('mock_current_assessment') || '{}');
      const mockStudents = JSON.parse(localStorage.getItem('mock_students') || '[]');
      const currentStudent = mockStudents[0] || { id: 1, name: 'Timmy Doe' };

      let history = JSON.parse(localStorage.getItem('mock_history') || '[]');
      const newHistoryItem = {
        id: currentAss.id || Date.now(),
        student_id: currentStudent.id,
        student_name: currentStudent.name,
        date: new Date().toLocaleDateString(),
        prediction: predictedDisability,
        severity: severityLevel,
        details: {
          reading: readingScore,
          writing: writingScore,
          math: mathScore,
          puzzle: puzzleScore,
          full_prediction: analysisPrediction
        }
      };
      history.unshift(newHistoryItem);
      localStorage.setItem('mock_history', JSON.stringify(history));

      responseData = {
        status: 'success',
        prediction: analysisPrediction
      };
    } else if (pathNoQuery.includes('/results/')) {
      const mockResults = JSON.parse(localStorage.getItem('mock_results_store') || '{}');
      responseData = {
        test_results: [
          { test_type: 'reading', score: mockResults.reading ? mockResults.reading.score : 85 },
          { test_type: 'writing', score: mockResults.writing ? mockResults.writing.score : 80 },
          { test_type: 'math', score: mockResults.math ? mockResults.math.score : 90 },
          { test_type: 'puzzle', score: mockResults.puzzle ? mockResults.puzzle.score : 85 }
        ]
      };
    } else if (pathNoQuery.endsWith('/history')) {
      const history = JSON.parse(localStorage.getItem('mock_history') || '[]');
      responseData = { history };
    } else if (pathNoQuery.includes('/reports/')) {
      const parts = pathNoQuery.split('/');
      const assId = parseInt(parts[parts.length - 1]);
      const history = JSON.parse(localStorage.getItem('mock_history') || '[]');
      const report = history.find((h) => h.id === assId) || {
        id: assId,
        student_id: 1,
        student_name: 'Timmy Doe',
        date: new Date().toLocaleDateString(),
        prediction: 'Normal',
        severity: 'None',
        details: {
          reading: 85,
          writing: 80,
          math: 90,
          puzzle: 85,
          full_prediction: {
            predicted_disability: 'No Learning Disability Detected',
            severity_percentage: 10,
            severity_level: 'None',
            confidence_score: 0.94,
            reasoning: 'Student demonstrates average performance across all sectors.',
            recommendations: ['Maintain current reading schedule.']
          }
        }
      };
      responseData = report;
    } else if (pathNoQuery.endsWith('/health')) {
      responseData = {
        status: 'healthy',
        model_loaded: true,
        message: 'API is running in Mock Mode!'
      };
    } else {
      responseData = { status: 'success', message: 'Mock endpoint hit' };
    }

    function saveMockTestResult(type, data) {
      const store = JSON.parse(localStorage.getItem('mock_results_store') || '{}');
      store[type] = data;
      localStorage.setItem('mock_results_store', JSON.stringify(store));
    }

    return new Response(JSON.stringify(responseData), {
      status: status,
      headers: {
        'Content-Type': 'application/json',
        'x-mock-server': 'true'
      }
    });
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

