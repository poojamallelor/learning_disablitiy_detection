import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import BrainScene from '../components/3D/BrainScene';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = Math.round(value);
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    let totalDuration = 800; // ms
    let increment = Math.ceil(end / (totalDuration / 16)); // ~60fps
    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{displayValue}</span>;
};

const KpiCard = ({ title, value, icon, gradient, color }) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative overflow-hidden bg-white rounded-[20px] p-6 shadow-lg border border-slate-100 flex flex-col justify-between h-full transition-all duration-300"
      style={{ minHeight: '140px' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider font-mono">{title}</p>
          <h4 className="text-3xl font-black text-slate-800 mt-1 flex items-baseline">
            <AnimatedNumber value={value} />
            <span className="text-lg font-bold text-slate-400 ml-0.5">%</span>
          </h4>
        </div>
        <span className={`text-3xl p-2.5 rounded-2xl shadow-sm ${gradient} border border-white/25 flex items-center justify-center`}>
          {icon}
        </span>
      </div>
      
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    authToken,
    currentUser,
    students,
    selectedStudent,
    updateStudents,
    setSelectedStudent,
    startAssessment,
    setCurrentAssessment,
    assessmentHistory,
    updateAssessmentHistory,
    logout,
    showError,
    showSuccess,
    setIsLoading,
  } = useAppContext();

  const [showNewStudentForm, setShowNewStudentForm] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    age: '',
    grade: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Emojis for student profile cards
  const avatars = ['🦊', '🐨', '🦁', '🐼', '🐯', '🐸', '🐵', '🦉'];

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    
    fetchStudents();
    fetchHistory();
  }, [authToken]);

  // Auto-set grade based on age helper
  const handleAgeChange = (ageVal) => {
    const age = parseInt(ageVal);
    let grade = 'Kindergarten';
    if (age === 5) grade = 'Kindergarten';
    else if (age === 6) grade = '1st Grade';
    else if (age === 7) grade = '2nd Grade';
    else if (age === 8) grade = '3rd Grade';
    else if (age === 9) grade = '4th Grade';
    else if (age === 10) grade = '5th Grade';
    else if (age === 11) grade = '6th Grade';
    else if (age === 12) grade = '7th Grade';
    
    setNewStudentData(prev => ({
      ...prev,
      age: ageVal,
      grade: grade
    }));
  };

  // ========================================
  // API CALLS
  // ========================================

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        updateStudents(data.students || []);
      } else {
        showError('Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        updateAssessmentHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // ========================================
  // STUDENT MANAGEMENT
  // ========================================

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!newStudentData.name || !newStudentData.age || !newStudentData.grade) {
      showError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newStudentData.name,
          age: parseInt(newStudentData.age),
          grade: newStudentData.grade,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedList = [...students, data.student];
        updateStudents(updatedList);
        setSelectedStudent(data.student); // Immediately select new profile
        setNewStudentData({ name: '', age: '', grade: '' });
        setShowNewStudentForm(false);
        showSuccess('Profile created successfully!');
      } else {
        showError(data.error || 'Failed to add student');
      }
    } catch (error) {
      showError('Error adding student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // ASSESSMENT MANAGEMENT
  // ========================================

  const handleStartAssessment = async (student) => {
    if (!student) {
      showError('Please select a student first');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ student_id: student.id }),
      });

      const data = await response.json();

      if (response.ok) {
        startAssessment(data.assessment);
        showSuccess('Assessment started!');
        setTimeout(() => navigate('/reading-test'), 1000);
      } else {
        showError(data.error || 'Failed to start assessment');
      }
    } catch (error) {
      showError('Error starting assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = (assessment) => {
    if (!assessment.prediction) {
      showError('This assessment does not have results yet');
      return;
    }
    setCurrentAssessment({ id: assessment.assessment_id || assessment.id });
    navigate('/results');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      logout();
      navigate('/');
    }
  };

  const getPercentageScore = (val) => {
    if (val === undefined || val === null) return 0;
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return num <= 1.01 ? num * 100 : num;
  };

  const resolvePrediction = (assessment) => {
    if (!assessment) return null;
    if (assessment.prediction && typeof assessment.prediction === 'object') {
      return assessment.prediction;
    }
    if (assessment.details && assessment.details.full_prediction && typeof assessment.details.full_prediction === 'object') {
      return assessment.details.full_prediction;
    }
    if (typeof assessment.prediction === 'string') {
      return {
        predicted_disability: assessment.prediction,
        severity_level: assessment.severity || 'Moderate',
        reading_indicator: assessment.details?.reading || 0,
        writing_indicator: assessment.details?.writing || 0,
        math_indicator: assessment.details?.math || 0,
        logic_indicator: assessment.details?.puzzle || 0,
        recommendations: assessment.details?.full_prediction?.recommendations || []
      };
    }
    return null;
  };

  const getPredictedDisability = (assessment) => {
    if (!assessment) return '';
    const predObj = resolvePrediction(assessment);
    return predObj ? predObj.predicted_disability : '';
  };

  const getSeverityLevel = (assessment) => {
    if (!assessment) return '';
    const predObj = resolvePrediction(assessment);
    return predObj ? predObj.severity_level : '';
  };

  const getIndicatorScore = (assessment, indicatorKey) => {
    if (!assessment) return 0;
    const predObj = resolvePrediction(assessment);
    if (predObj && predObj[indicatorKey] !== undefined) {
      return getPercentageScore(predObj[indicatorKey]);
    }
    if (assessment.test_scores) {
      const mapping = {
        reading_indicator: 'reading',
        writing_indicator: 'writing',
        math_indicator: 'math',
        logic_indicator: 'puzzle'
      };
      const scoreKey = mapping[indicatorKey];
      if (scoreKey && assessment.test_scores[scoreKey] !== undefined) {
        return getPercentageScore(assessment.test_scores[scoreKey]);
      }
    }
    return 0;
  };

  // ========================================
  // TREND GRAPH DATA PROCESSING
  // ========================================

  const studentHistory = assessmentHistory.filter(
    (a) => a.student_id === selectedStudent?.id
  );

  const completedHistory = [...studentHistory]
    .filter((a) => a.status === 'completed' || a.prediction || a.test_scores)
    .sort((a, b) => new Date(a.completed_at || a.date) - new Date(b.completed_at || b.date));

  const hasTrendData = completedHistory.length > 0;

  const trendChartData = {
    labels: completedHistory.map((a) => {
      const dateVal = a.completed_at || a.date;
      return dateVal ? new Date(dateVal).toLocaleDateString() : 'N/A';
    }),
    datasets: [
      {
        label: 'Reading Accuracy',
        data: completedHistory.map((a) => getIndicatorScore(a, 'reading_indicator')),
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Writing Accuracy',
        data: completedHistory.map((a) => getIndicatorScore(a, 'writing_indicator')),
        borderColor: '#C4B5FD',
        backgroundColor: '#C4B5FD',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#C4B5FD',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Math Accuracy',
        data: completedHistory.map((a) => getIndicatorScore(a, 'math_indicator')),
        borderColor: '#5B21B6',
        backgroundColor: '#5B21B6',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#5B21B6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Puzzle Accuracy',
        data: completedHistory.map((a) => getIndicatorScore(a, 'logic_indicator')),
        borderColor: '#4C1D95',
        backgroundColor: '#4C1D95',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#4C1D95',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#2D1B69',
          font: { weight: '700' }
        }
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
  };

  const lastAssessment = [...completedHistory].pop();
  const activePrediction = resolvePrediction(lastAssessment);
  const activeRecommendations = activePrediction?.recommendations || [];
  const activeDisability = activePrediction?.predicted_disability || null;
  const activeSeverity = activePrediction?.severity_level || null;

  // Find latest assessment for status hud (regardless of completion status)
  const latestAssessment = [...studentHistory].sort((a, b) => new Date(b.started_at || b.date) - new Date(a.started_at || a.date))[0];

  const activeScores = activePrediction ? {
    attention: getPercentageScore(activePrediction.logic_indicator),
    reading: getPercentageScore(activePrediction.reading_indicator),
    writing: getPercentageScore(activePrediction.writing_indicator),
    math: getPercentageScore(activePrediction.math_indicator)
  } : null;

  // Pagination for assessment history table
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedHistory = studentHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(studentHistory.length / itemsPerPage);

  // Reset page when switching student
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStudent]);

  // ========================================
  // RENDER  // Stage 1: PROFILE SELECTOR WALL (If no student is selected)
  if (!selectedStudent) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center relative z-10 text-slate-600">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-6xl filter drop-shadow-md">🎒</span>
          <h1 className="text-5xl font-black text-[#2D1B69] mt-4 tracking-tight filter drop-shadow-sm">
            Who is learning today?
          </h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">Select your profile or add a new one to start playing!</p>
        </motion.div>

        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {!showNewStudentForm ? (
              <motion.div
                key="profiles"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {students.map((student, index) => {
                  const avatar = avatars[index % avatars.length];
                  return (
                    <motion.div
                      key={student.id}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedStudent(student)}
                      className="card card-hover p-6 flex flex-col items-center text-center cursor-pointer hover:border-purple-400/40 hover:shadow-purple-500/5"
                    >
                      <span className="text-6xl mb-4 select-none filter drop-shadow-md">{avatar}</span>
                      <h3 className="font-black text-xl text-[#2D1B69] tracking-wide">{student.name}</h3>
                      <span className="px-3 py-1 bg-purple-100/70 text-[#6D28D9] border border-purple-200/50 rounded-full text-xs font-extrabold mt-3">
                        Age {student.age} • {student.grade}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Add Profile Trigger Card */}
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewStudentForm(true)}
                  className="bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-purple-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white hover:border-[#8B5CF6] transition-all min-h-[180px] shadow-sm"
                >
                  <span className="text-5xl text-[#6D28D9] mb-2 font-light">+</span>
                  <h3 className="font-bold text-lg text-[#6D28D9]">Add Profile</h3>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto card p-8 border border-purple-100"
              >
                <h2 className="text-2xl font-black text-[#2D1B69] mb-6 text-center">New Student Profile</h2>
                <form onSubmit={handleAddStudent} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-1.5">Child's Name</label>
                    <input
                      type="text"
                      placeholder="What is your name?"
                      value={newStudentData.name}
                      onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                      className="input-field text-lg"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-1.5">Age (5-12)</label>
                      <select
                        value={newStudentData.age}
                        onChange={(e) => handleAgeChange(e.target.value)}
                        className="input-field text-lg appearance-none"
                        style={{ colorScheme: 'dark' }}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="" className="bg-white text-purple-950">Select</option>
                        {[5,6,7,8,9,10,11,12].map(a => (
                          <option key={a} value={a} className="bg-white text-purple-950">{a} Years</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 mb-1.5">Auto-Grade</label>
                      <input
                        type="text"
                        value={newStudentData.grade}
                        className="input-field bg-purple-50/50 border-purple-100 text-slate-400 text-lg select-none"
                        disabled={true}
                        placeholder="Grade"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewStudentForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleLogout}
          className="mt-12 btn-secondary text-[#C4B5FD] hover:text-[#FFFFFF] hover:bg-[#8B5CF6]/15 border-[#8B5CF6]/30"
        >
          Logout of Account
        </motion.button>
      </div>
    );
  }

  // Stage 2: THE DASHBOARD VIEW (when selectedStudent is active)
  return (
    <div className="min-h-screen p-6 relative z-10 max-w-7xl mx-auto w-full flex flex-col gap-6 text-slate-655">
      {/* Header Frosted Navbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 card border-purple-100/50 gap-4"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent filter drop-shadow-sm">
            Student Assessment Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="font-bold text-slate-500">Currently playing:</span>
            <span className="px-3 py-1 bg-purple-100/70 text-[#6D28D9] border border-purple-200/50 rounded-full font-extrabold text-sm">
              🐨 {selectedStudent.name} (Age {selectedStudent.age})
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedStudent(null)}
              className="text-xs font-black text-[#6D28D9] hover:text-[#4C1D95] underline bg-transparent border-0 cursor-pointer"
            >
              Switch Profile 👤
            </motion.button>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStartAssessment(selectedStudent)}
            className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2"
          >
            Start Assessment 🚀
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="btn-secondary py-2.5 px-5 text-xs text-[#C4B5FD] hover:text-[#FFFFFF] hover:bg-[#8B5CF6]/15 border-[#8B5CF6]/30"
          >
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* TOP KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Reading Score"
          value={lastAssessment ? getIndicatorScore(lastAssessment, 'reading_indicator') : 0}
          icon="📖"
          gradient="bg-purple-100/50 text-[#8B5CF6]"
          color="bg-[#8B5CF6]"
        />
        <KpiCard
          title="Writing Score"
          value={lastAssessment ? getIndicatorScore(lastAssessment, 'writing_indicator') : 0}
          icon="✍️"
          gradient="bg-indigo-100/50 text-[#6D28D9]"
          color="bg-[#6D28D9]"
        />
        <KpiCard
          title="Math Score"
          value={lastAssessment ? getIndicatorScore(lastAssessment, 'math_indicator') : 0}
          icon="🧮"
          gradient="bg-violet-100/50 text-[#5B21B6]"
          color="bg-[#5B21B6]"
        />
        <KpiCard
          title="Puzzle Score"
          value={lastAssessment ? getIndicatorScore(lastAssessment, 'logic_indicator') : 0}
          icon="🧩"
          gradient="bg-fuchsia-100/50 text-[#4C1D95]"
          color="bg-[#4C1D95]"
        />
      </div>

      {/* MAIN CONTENT SECTION: Performance Progress Graph (65%) & 3D Brain (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Progress Graph (65%) */}
        <div className="lg:col-span-8 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card flex flex-col justify-between p-6 h-[400px]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <div>
                <h3 className="text-xl font-black text-[#2D1B69] tracking-tight">
                  Performance Progress
                </h3>
                <p className="text-xs text-slate-500 font-bold">Developmental tracking graph for {selectedStudent.name}</p>
              </div>
              {activeDisability && (
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
                  activeDisability.includes('No') 
                    ? 'bg-purple-100/50 text-purple-700 border-purple-200' 
                    : 'bg-purple-100 text-[#6D28D9] border-purple-300'
                }`}>
                  {activeDisability} ({activeSeverity || 'Mild'})
                </span>
              )}
            </div>

            <div className="flex-1 w-full min-h-0 relative">
              {hasTrendData ? (
                <Line data={trendChartData} options={chartOptions} />
              ) : (
                <div className="text-center py-8 px-6 bg-purple-50/50 rounded-3xl border-2 border-dashed border-purple-200 h-full flex flex-col justify-center items-center">
                  <span className="text-5xl filter drop-shadow-sm mb-3">📊</span>
                  <h4 className="font-extrabold text-[#2D1B69] text-lg">No assessment data available yet</h4>
                  <p className="text-slate-500 text-xs font-semibold max-w-sm mx-auto mt-1 mb-4">
                    Complete at least one assessment battery for {selectedStudent.name} to view developmental tracking graphs and AI predictions.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStartAssessment(selectedStudent)}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                  >
                    Start Assessment 🚀
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 3D Brain Map (35%) */}
        <div className="lg:col-span-4 flex flex-col">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="card flex flex-col justify-between p-6 h-[400px]"
          >
            <h3 className="text-xl font-black text-[#2D1B69] mb-2 tracking-tight">Interactive 3D Neural Map</h3>
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
              <BrainScene transparent={true} scores={activeScores} />
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#6B7280] font-mono tracking-widest border-t border-purple-100 pt-2 pointer-events-none mt-2">
              <span>DRAG TO ROTATE • SCROLL TO ZOOM</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* SECOND ROW: Diagnosis Summary & Student Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnosis Summary Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="card p-6 flex flex-col justify-between"
          style={{ minHeight: '220px' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl filter drop-shadow-sm">🩺</span>
            <div>
              <h4 className="text-[#2D1B69] font-black text-sm tracking-wide">Diagnosis Summary</h4>
              <p className="text-slate-400 text-[10px] font-mono uppercase">Clinical AI Intelligence</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Diagnosis</p>
              <p className="text-sm font-black text-[#2D1B69] mt-1 break-words">
                {activeDisability ? activeDisability : 'No Record'}
              </p>
            </div>
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Severity</p>
              <p className="text-base font-black text-[#6D28D9] mt-1">
                {activeSeverity ? activeSeverity : '—'}
              </p>
            </div>
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Confidence</p>
              <p className="text-base font-black text-[#2D1B69] mt-1">
                {activePrediction ? `${(getPercentageScore(activePrediction.confidence_score)).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Risk Level</p>
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono border mt-2 ${
                activeSeverity === 'Severe' || activeSeverity === 'High'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : activeSeverity === 'Moderate'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : activeSeverity === 'Mild'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {activeSeverity ? activeSeverity.toUpperCase() : 'NONE'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Student Metrics */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="card p-6 flex flex-col justify-between"
          style={{ minHeight: '220px' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl filter drop-shadow-sm">👤</span>
            <div>
              <h4 className="text-[#2D1B69] font-black text-sm tracking-wide">Student Metrics</h4>
              <p className="text-slate-400 text-[10px] font-mono uppercase">Performance Profile</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Student Name</p>
              <p className="text-sm font-black text-[#2D1B69] mt-1 truncate">
                {selectedStudent.name}
              </p>
            </div>
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Completed Run</p>
              <p className="text-base font-black text-[#6D28D9] mt-1">
                {completedHistory.length}
              </p>
            </div>
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Last Run Date</p>
              <p className="text-xs font-black text-[#2D1B69] mt-1.5">
                {completedHistory.length > 0 
                  ? new Date(completedHistory[completedHistory.length - 1].completed_at || completedHistory[completedHistory.length - 1].date).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-[16px] text-center shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Avg Accuracy</p>
              <p className="text-base font-black text-[#2D1B69] mt-1">
                {completedHistory.length > 0
                  ? `${(completedHistory.reduce((sum, a) => sum + (getIndicatorScore(a, 'reading_indicator') + getIndicatorScore(a, 'writing_indicator') + getIndicatorScore(a, 'math_indicator') + getIndicatorScore(a, 'logic_indicator')) / 4, 0) / completedHistory.length).toFixed(1)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* THIRD ROW: Recommendations Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl filter drop-shadow-sm">💡</span>
          <div>
            <h3 className="text-xl font-black text-[#2D1B69] tracking-tight">
              Personalized Recommendations
            </h3>
            <p className="text-xs text-slate-500 font-bold">Actionable improvement suggestions based on current assessment indicators</p>
          </div>
        </div>
        
        {activeRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeRecommendations.map((rec, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                className="flex flex-col justify-between p-4 bg-slate-50 border border-slate-100 rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-2.5 items-start">
                  <span className="text-[#6D28D9] font-black text-base">✓</span>
                  <span className="text-xs font-semibold text-slate-600 leading-relaxed">{rec}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-[16px] text-center max-w-lg mx-auto">
            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
              No recommendations available. Complete an assessment to receive personalized clinical suggestions.
            </p>
          </div>
        )}
      </motion.div>

      {/* FOURTH ROW: Assessment History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="text-2xl font-black mb-6 text-[#2D1B69] tracking-tight">
          Assessment History & Reports for {selectedStudent.name}
        </h2>
        
        {studentHistory.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-sm font-black">
                    <th className="text-left py-3 px-4 uppercase tracking-wider font-bold text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider font-bold text-slate-500">Reading</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider font-bold text-slate-500">Writing</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider font-bold text-slate-500">Math</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider font-bold text-slate-500">Puzzle</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider font-bold text-slate-500">Diagnosis</th>
                    <th className="text-left py-3 px-4 uppercase tracking-wider font-bold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.map((assessment) => (
                    <tr key={assessment.assessment_id || assessment.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-[#2D1B69]">
                        {assessment.completed_at
                          ? new Date(assessment.completed_at).toLocaleDateString()
                          : assessment.date
                          ? new Date(assessment.date).toLocaleDateString()
                          : 'In Progress'}
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {getIndicatorScore(assessment, 'reading_indicator')}%
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {getIndicatorScore(assessment, 'writing_indicator')}%
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {getIndicatorScore(assessment, 'math_indicator')}%
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {getIndicatorScore(assessment, 'logic_indicator')}%
                      </td>
                      <td className="py-4 px-4 font-bold">
                        {resolvePrediction(assessment) ? (
                          <span className={`${
                            getPredictedDisability(assessment).includes('No Learning')
                              ? 'text-slate-700'
                              : 'text-[#6D28D9]'
                          }`}>
                            {getPredictedDisability(assessment)}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Pending</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {resolvePrediction(assessment) ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleViewReport(assessment)}
                            className="text-[#6D28D9] hover:text-[#4C1D95] font-black text-sm hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            View Report →
                          </motion.button>
                        ) : (
                          <span className="text-slate-500 font-medium">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">
                  Showing page {currentPage} of {totalPages} ({studentHistory.length} runs)
                </span>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                  >
                    Previous
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-6 font-bold">No assessments completed yet for {selectedStudent.name}.</p>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
