import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import LiquidEther from './components/LiquidEther';

// Auth Pages
import LoginPage from './pages/LoginPage';

// Dashboard Pages
import Dashboard from './pages/Dashboard';

// Test Pages
import ReadingTestPage from './pages/ReadingTestPage';
import WritingTestPage from './pages/WritingTestPage';
import MathTestPage from './pages/MathTestPage';
import PuzzleTestPage from './pages/PuzzleTestPage';
import ResultsPage from './pages/ResultsPage';

// Home Page (existing)
import HomePage from './pages/HomePage';
import PredictionDemo from './components/PredictionDemo';

function App() {
  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
        {/* Liquid Ether Purple Background - Full Screen */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: 'auto',
            width: '100%',
            height: '100%'
          }}
        >
          <LiquidEther
            colors={['#F8F7FC', '#EDE9FE', '#DDD6FE', '#F3E8FF']}
            mouseForce={25}
            cursorSize={120}
            isViscous
            viscous={25}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.6}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.7}
            autoIntensity={2.5}
            takeoverDuration={0.3}
            autoResumeDelay={2500}
            autoRampDuration={0.8}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Content Overlay */}
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', width: '100%' }}>
          <AppProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/ml-prediction" element={<PredictionDemo />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Assessment Routes */}
              <Route path="/reading-test" element={<ReadingTestPage />} />
              <Route path="/writing-test" element={<WritingTestPage />} />
              <Route path="/math-test" element={<MathTestPage />} />
              <Route path="/puzzle-test" element={<PuzzleTestPage />} />
              <Route path="/results" element={<ResultsPage />} />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppProvider>
        </div>
      </div>
    </Router>
  );
}

export default App;
