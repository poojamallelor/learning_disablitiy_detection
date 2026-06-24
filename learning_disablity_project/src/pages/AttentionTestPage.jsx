import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Loader } from '../components/ui/index.jsx';
import { Navbar } from '../components/Layout/index.jsx';
import { useAppContext } from '../contexts/AppContext';
import { generateRandomNumber } from '../utils/helpers.js';

const AttentionTestPage = () => {
  const navigate = useNavigate();
  const { updateTestResults } = useAppContext();
  const [testState, setTestState] = useState('before'); // before, playing, results
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [reactionTimes, setReactionTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [hits, setHits] = useState(0);
  const [missed, setMissed] = useState(0);
  const [message, setMessage] = useState('');

  const maxRounds = 10;
  const containerWidth = 600;
  const containerHeight = 400;

  const generateNewTarget = () => {
    if (round <= maxRounds) {
      const newX = generateRandomNumber(50, containerWidth - 100);
      const newY = generateRandomNumber(50, containerHeight - 100);
      setTargetPosition({ x: newX, y: newY });
      setStartTime(Date.now());
      setMessage('');
    }
  };

  const handleStartTest = () => {
    setTestState('playing');
    setScore(0);
    setRound(1);
    setReactionTimes([]);
    setHits(0);
    setMissed(0);
    generateNewTarget();
  };

  const handleTargetClick = () => {
    if (startTime) {
      const reactionTime = Date.now() - startTime;
      setReactionTimes((prev) => [...prev, reactionTime]);
      setScore((prev) => prev + 1);
      setHits((prev) => prev + 1);
      setMessage('🎉 Hit!');

      if (round < maxRounds) {
        setTimeout(() => {
          setRound((prev) => prev + 1);
          generateNewTarget();
        }, 500);
      } else {
        setTimeout(() => {
          handleFinishTest();
        }, 1000);
      }
    }
  };

  const handleMissClick = () => {
    setMissed((prev) => prev + 1);
    setMessage('❌ Missed!');

    if (round < maxRounds) {
      setTimeout(() => {
        setRound((prev) => prev + 1);
        generateNewTarget();
      }, 500);
    } else {
      setTimeout(() => {
        handleFinishTest();
      }, 1000);
    }
  };

  const handleFinishTest = () => {
    const avgReactionTime =
      reactionTimes.length > 0
        ? Math.round(
            reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
          )
        : 0;

    const accuracy = Math.round((hits / maxRounds) * 100);

    const result = {
      attention: {
        score: accuracy,
        hits,
        missed,
        accuracy,
        avgReactionTime,
      },
    };

    updateTestResults(result);
    setTestState('results');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="container-custom">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-4xl font-bold text-dark flex items-center gap-3">
                🎯 Attention Test
              </h1>
            </motion.div>

            {/* Before Test */}
            {testState === 'before' && (
              <motion.div variants={itemVariants}>
                <Card className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-6"
                  >
                    🎮
                  </motion.div>
                  <h2 className="text-3xl font-bold text-dark mb-6">
                    Attention & Reaction Game
                  </h2>
                  <div className="bg-blue-50 rounded-2xl p-8 mb-8 text-left">
                    <h3 className="font-bold text-dark mb-4">How to play:</h3>
                    <ul className="space-y-3 text-gray-700">
                      <li>
                        🟥 A red circle will appear at random locations
                      </li>
                      <li>
                        ⚡ Click on it as fast as you can
                      </li>
                      <li>
                        🎯 You'll have 10 rounds to test your reaction time
                      </li>
                      <li>
                        📊 Your accuracy and reaction time will be measured
                      </li>
                    </ul>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartTest}
                    className="w-full"
                  >
                    Start Game →
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* Playing */}
            {testState === 'playing' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Stats */}
                <motion.div variants={itemVariants} className="mb-6">
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="text-center">
                      <p className="text-gray-600 text-sm">Round</p>
                      <p className="text-3xl font-bold text-primary">
                        {round}/{maxRounds}
                      </p>
                    </Card>
                    <Card className="text-center">
                      <p className="text-gray-600 text-sm">Hits</p>
                      <p className="text-3xl font-bold text-success">
                        {hits}
                      </p>
                    </Card>
                    <Card className="text-center">
                      <p className="text-gray-600 text-sm">Missed</p>
                      <p className="text-3xl font-bold text-error">
                        {missed}
                      </p>
                    </Card>
                    <Card className="text-center">
                      <p className="text-gray-600 text-sm">Score</p>
                      <p className="text-3xl font-bold text-secondary">
                        {Math.round((hits / maxRounds) * 100)}%
                      </p>
                    </Card>
                  </div>
                </motion.div>

                {/* Game Area */}
                <motion.div
                  variants={itemVariants}
                  className="relative mb-6 bg-white rounded-3xl shadow-soft overflow-hidden"
                  style={{ width: containerWidth, height: containerHeight, margin: '0 auto' }}
                  onClick={handleMissClick}
                >
                  {/* Target */}
                  <motion.button
                    key={`${round}-${targetPosition.x}-${targetPosition.y}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTargetClick();
                    }}
                    style={{
                      position: 'absolute',
                      left: targetPosition.x,
                      top: targetPosition.y,
                      cursor: 'pointer',
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg hover:shadow-glow transition-all"
                  />

                  {/* Message */}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center text-4xl font-bold pointer-events-none"
                    >
                      {message}
                    </motion.div>
                  )}
                </motion.div>

                <div className="text-center text-gray-600">
                  <p>Click on the red circle as fast as you can!</p>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {testState === 'results' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-6xl mb-6"
                  >
                    ✨
                  </motion.div>
                  <h2 className="text-3xl font-bold text-dark mb-4">
                    Game Over!
                  </h2>

                  <div className="grid md:grid-cols-4 gap-6 my-8">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <p className="text-gray-600 text-sm mb-2">Hits</p>
                      <p className="text-4xl font-bold text-primary">
                        {hits}
                      </p>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100">
                      <p className="text-gray-600 text-sm mb-2">Missed</p>
                      <p className="text-4xl font-bold text-error">
                        {missed}
                      </p>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                      <p className="text-gray-600 text-sm mb-2">Avg Reaction</p>
                      <p className="text-4xl font-bold text-warning">
                        {reactionTimes.length > 0
                          ? Math.round(
                              reactionTimes.reduce((a, b) => a + b, 0) /
                                reactionTimes.length
                            )
                          : 0}
                        ms
                      </p>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                      <p className="text-gray-600 text-sm mb-2">Score</p>
                      <p className="text-4xl font-bold text-success">
                        {Math.round((hits / maxRounds) * 100)}%
                      </p>
                    </Card>
                  </div>

                  <p className="text-xl text-gray-600 mb-6">
                    Excellent concentration! Moving to results page...
                  </p>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/assessment/results')}
                    className="w-full"
                  >
                    View All Results →
                  </Button>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AttentionTestPage;
