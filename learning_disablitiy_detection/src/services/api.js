const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

// ========================================
// AUTHENTICATION
// ========================================

export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (username, email, password, fullName, role) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, full_name: fullName, role }),
    });
    return await response.json();
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const googleLogin = async (email, fullName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName }),
    });
    return await response.json();
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

// ========================================
// STUDENTS
// ========================================

export const createStudent = async (token, name, age, grade) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, age, grade }),
    });
    return await response.json();
  } catch (error) {
    console.error('Create student error:', error);
    throw error;
  }
};

export const getStudents = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Get students error:', error);
    throw error;
  }
};

export const getStudent = async (token, studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Get student error:', error);
    throw error;
  }
};

// ========================================
// ASSESSMENTS
// ========================================

export const startAssessment = async (token, studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ student_id: studentId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Start assessment error:', error);
    throw error;
  }
};

export const getAssessment = async (token, assessmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/${assessmentId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Get assessment error:', error);
    throw error;
  }
};

// ========================================
// TEST SUBMISSIONS
// ========================================

export const submitAssessment = async (token, assessmentId, resultsPayload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assessments/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assessment_id: assessmentId,
        results: resultsPayload
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Submit assessment error:', error);
    throw error;
  }
};

// ========================================
// RESULTS
// ========================================

export const getResults = async (token, assessmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/results/${assessmentId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Get results error:', error);
    throw error;
  }
};

// ========================================
// HISTORY
// ========================================

export const getHistory = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Get history error:', error);
    throw error;
  }
};

export const getReport = async (token, assessmentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${assessmentId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (error) {
    console.error('Get report error:', error);
    throw error;
  }
};

// ========================================
// HEALTH CHECK
// ========================================

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};
