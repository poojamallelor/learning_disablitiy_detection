import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Authentication State
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  
  // Student State
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Assessment State
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [assessmentStep, setAssessmentStep] = useState(0); // 0=reading, 1=writing, 2=math, 3=puzzle, 4=analysis
  
  // Test Results
  const [testResults, setTestResults] = useState({
    reading: {
      score: null,
      time_taken: null,
      ideal_time: null,
      extra_time: null,
      accuracy: null,
      details: {}
    },
    writing: {
      score: null,
      accuracy: null,
      details: {}
    },
    math: {
      score: null,
      accuracy: null,
      details: {}
    },
    puzzle: {
      score: null,
      accuracy: null,
      details: {}
    },
    prediction: null,
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // History State
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  
  // Authentication Methods
  const updateAuthToken = (token) => {
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };
  
  const updateUserRole = (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };
  
  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUserRole(null);
    setSelectedStudent(null);
    setCurrentAssessment(null);
    setTestResults({
      reading: { score: null, time_taken: null, ideal_time: null, extra_time: null, accuracy: null, details: {} },
      writing: { score: null, accuracy: null, details: {} },
      math: { score: null, accuracy: null, details: {} },
      puzzle: { score: null, accuracy: null, details: {} },
      prediction: null,
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  };
  
  // Student Methods
  const addStudent = (student) => {
    setStudents([...students, student]);
  };
  
  const updateStudents = (studentList) => {
    setStudents(studentList);
  };
  
  // Assessment Methods
  const startAssessment = (assessment) => {
    setCurrentAssessment(assessment);
    setAssessmentStep(0);
  };
  
  const updateTestResult = (testType, result) => {
    setTestResults((prev) => ({
      ...prev,
      [testType]: { ...prev[testType], ...result }
    }));
  };
  
  const nextAssessmentStep = () => {
    setAssessmentStep((prev) => Math.min(prev + 1, 4));
  };
  
  const prevAssessmentStep = () => {
    setAssessmentStep((prev) => Math.max(prev - 1, 0));
  };
  
  const completeAssessment = (prediction) => {
    setTestResults((prev) => ({ ...prev, prediction }));
    setAssessmentStep(4); // Show results
  };
  
  const resetAssessment = () => {
    setCurrentAssessment(null);
    setAssessmentStep(0);
    setTestResults({
      reading: { score: null, time_taken: null, ideal_time: null, extra_time: null, accuracy: null, details: {} },
      writing: { score: null, accuracy: null, details: {} },
      math: { score: null, accuracy: null, details: {} },
      puzzle: { score: null, accuracy: null, details: {} },
      prediction: null,
    });
  };
  
  // Error and Success Messages
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };
  
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };
  
  // History Methods
  const updateAssessmentHistory = (history) => {
    setAssessmentHistory(history);
  };

  return (
    <AppContext.Provider
      value={{
        // Auth
        authToken,
        updateAuthToken,
        currentUser,
        setCurrentUser,
        userRole,
        updateUserRole,
        logout,
        
        // Students
        students,
        setStudents,
        selectedStudent,
        setSelectedStudent,
        addStudent,
        updateStudents,
        
        // Assessment
        currentAssessment,
        setCurrentAssessment,
        startAssessment,
        assessmentStep,
        setAssessmentStep,
        nextAssessmentStep,
        prevAssessmentStep,
        completeAssessment,
        resetAssessment,
        
        // Test Results
        testResults,
        updateTestResult,
        
        // UI
        isLoading,
        setIsLoading,
        error,
        showError,
        successMessage,
        showSuccess,
        
        // History
        assessmentHistory,
        updateAssessmentHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
