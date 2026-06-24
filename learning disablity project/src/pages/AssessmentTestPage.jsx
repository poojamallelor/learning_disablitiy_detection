import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, ProgressBar, Card, Badge } from '../components/ui/index.jsx';
import { Navbar } from '../components/Layout/index.jsx';
import { useAppContext } from '../contexts/AppContext';
import { useSteps } from '../hooks/useCustom.js';

const AssessmentTestPage = () => {
  const navigate = useNavigate();
  const { userData, updateTestResults, setCurrentStep } = useAppContext();
  const steps = useSteps(4);

  const tests = [
    {
      id: 'reading',
      name: 'Reading Test',
      icon: '📖',
      description: 'Assess reading speed and comprehension',
      duration: '8 mins',
      color: 'from-blue-400 to-blue-600',
    },
    {
      id: 'writing',
      name: 'Writing Test',
      icon: '✍️',
      description: 'Evaluate writing and motor skills',
      duration: '7 mins',
      color: 'from-purple-400 to-purple-600',
    },
    {
      id: 'math',
      name: 'Math Test',
      icon: '🔢',
      description: 'Test mathematical abilities',
      duration: '8 mins',
      color: 'from-green-400 to-green-600',
    },
    {
      id: 'attention',
      name: 'Attention Test',
      icon: '🎯',
      description: 'Measure focus and concentration',
      duration: '7 mins',
      color: 'from-orange-400 to-red-600',
    },
  ];

  const currentTest = tests[steps.currentStep];

  const handleStartTest = () => {
    setCurrentStep(steps.currentStep);
    navigate(`/assessment/${currentTest.id}`);
  };

  const handleSkipTest = () => {
    if (steps.currentStep < 3) {
      steps.nextStep();
    } else {
      navigate('/assessment/results');
    }
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
            {/* Progress Section */}
            <motion.div variants={itemVariants} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-dark">Assessment Progress</h2>
                <Badge variant="primary">
                  {steps.currentStep + 1} of {tests.length}
                </Badge>
              </div>
              <div className="space-y-2">
                <ProgressBar
                  current={steps.currentStep + 1}
                  total={tests.length}
                  color="from-primary to-secondary"
                />
                <p className="text-sm text-gray-600 text-right">
                  {Math.round(steps.progress)}% Complete
                </p>
              </div>
            </motion.div>

            {/* Current Test Card */}
            <motion.div variants={itemVariants} className="mb-12">
              <Card className="overflow-hidden">
                <div
                  className={`h-32 bg-gradient-to-r ${currentTest.color} flex items-end justify-start p-8 text-white`}
                >
                  <div className="text-6xl">{currentTest.icon}</div>
                </div>

                <div className="p-10">
                  <h3 className="text-4xl font-bold text-dark mb-3">
                    {currentTest.name}
                  </h3>

                  <p className="text-xl text-gray-600 mb-6">
                    {currentTest.description}
                  </p>

                  <div className="flex gap-4 mb-10">
                    <Badge variant="success">⏱️ {currentTest.duration}</Badge>
                    <Badge variant="info">👤 {userData.name}</Badge>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 mb-10"
                  >
                    <h4 className="font-bold text-dark mb-4">Instructions:</h4>
                    {currentTest.id === 'reading' && (
                      <ul className="space-y-3 text-gray-700">
                        <li>🎤 Read the text aloud into the microphone</li>
                        <li>💬 Speak clearly and naturally at your own pace</li>
                        <li>❌ No comprehension questions after reading</li>
                        <li>✨ Accuracy, speed, and pronunciation will be analyzed</li>
                      </ul>
                    )}
                    {currentTest.id === 'writing' && (
                      <ul className="space-y-3 text-gray-700">
                        <li>✏️ Draw on the canvas provided</li>
                        <li>🖱️ Use your mouse or touchscreen</li>
                        <li>🎨 Demonstrate your motor skills</li>
                        <li>📸 Your drawing will be analyzed</li>
                      </ul>
                    )}
                    {currentTest.id === 'math' && (
                      <ul className="space-y-3 text-gray-700">
                        <li>🔢 Solve mathematical problems</li>
                        <li>⏱️ Each question has a time limit</li>
                        <li>🎯 Select or type your answers</li>
                        <li>✅ Get instant feedback</li>
                      </ul>
                    )}
                    {currentTest.id === 'attention' && (
                      <ul className="space-y-3 text-gray-700">
                        <li>👀 Focus on the moving objects</li>
                        <li>🎮 Click or tap when instructed</li>
                        <li>⚡ Test your reaction time</li>
                        <li>🏆 Challenge yourself!</li>
                      </ul>
                    )}
                  </motion.div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartTest}
                      className="flex-1"
                    >
                      Start Test →
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleSkipTest}
                      className="flex-1"
                    >
                      Skip for Now
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Test Timeline */}
            <motion.div variants={itemVariants}>
              <h4 className="text-xl font-bold text-dark mb-6">Assessment Timeline</h4>
              <div className="space-y-4">
                {tests.map((test, index) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      index === steps.currentStep
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                        : index < steps.currentStep
                        ? 'bg-success bg-opacity-10 text-success'
                        : 'bg-white shadow-soft'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-white bg-opacity-20">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{test.name}</p>
                      <p className="text-sm opacity-75">{test.duration}</p>
                    </div>
                    {index < steps.currentStep && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl"
                      >
                        ✅
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTestPage;
