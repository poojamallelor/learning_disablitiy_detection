/**
 * Calculate Words Per Minute
 */
export const calculateWPM = (wordCount, timeInSeconds) => {
  if (timeInSeconds === 0) return 0;
  const minutes = timeInSeconds / 60;
  return Math.round(wordCount / minutes);
};

/**
 * Calculate accuracy percentage
 */
export const calculateAccuracy = (correct, total) => {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

/**
 * Get difficulty level based on age
 */
export const getDifficultyByAge = (age) => {
  if (age < 8) return 'easy';
  if (age < 10) return 'medium';
  return 'hard';
};

/**
 * Get age group for reading text
 */
export const getAgeGroup = (age) => {
  if (age < 8) return 6;
  if (age < 10) return 8;
  if (age < 12) return 10;
  return 12;
};

/**
 * Calculate score based on multiple factors
 */
export const calculateScore = (metrics) => {
  const weights = {
    accuracy: 0.4,
    speed: 0.3,
    consistency: 0.3,
  };

  let score = 0;
  if (metrics.accuracy) {
    score += (metrics.accuracy / 100) * 100 * weights.accuracy;
  }
  if (metrics.speed) {
    // Normalize speed (max 200 WPM = 100 points)
    const normalizedSpeed = Math.min(metrics.speed / 2, 100);
    score += normalizedSpeed * weights.speed;
  }
  if (metrics.consistency) {
    score += metrics.consistency * weights.consistency;
  }

  return Math.round(score);
};

/**
 * Determine disability risk level
 */
export const assessRiskLevel = (score) => {
  if (score >= 80) return { level: 'Low Risk', color: 'success' };
  if (score >= 60) return { level: 'Medium Risk', color: 'warning' };
  return { level: 'High Risk', color: 'error' };
};

/**
 * Format time to readable format
 */
export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let result = [];
  if (hrs > 0) result.push(`${hrs}h`);
  if (mins > 0) result.push(`${mins}m`);
  result.push(`${secs}s`);

  return result.join(' ');
};

/**
 * Generate random number
 */
export const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Shuffle array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Get avatar emoji based on age
 */
export const getAvatarEmoji = (age) => {
  if (age < 8) return '👦';
  if (age < 12) return '🧒';
  return '👨‍🎓';
};

/**
 * Get encouragement message
 */
export const getEncouragementMessage = (score, testType) => {
  const messages = {
    excellent: [
      'Outstanding! You did amazing!',
      'Fantastic performance!',
      'Absolutely brilliant!',
      'You\'re a superstar!',
    ],
    good: [
      'Great job! Well done!',
      'You did really well!',
      'Impressive work!',
      'Keep it up!',
    ],
    average: [
      'Good attempt! Keep practicing!',
      'You\'re doing well, keep trying!',
      'Nice effort! Let\'s try again!',
      'Keep pushing forward!',
    ],
    needsWork: [
      'Don\'t worry! Practice makes perfect!',
      'Keep learning and improving!',
      'Every attempt makes you stronger!',
      'You\'ll do better next time!',
    ],
  };

  let level;
  if (score >= 80) level = 'excellent';
  else if (score >= 60) level = 'good';
  else if (score >= 40) level = 'average';
  else level = 'needsWork';

  const messageArray = messages[level];
  return messageArray[Math.floor(Math.random() * messageArray.length)];
};

/**
 * Convert base64 to file
 */
export const base64ToFile = (base64String, filename) => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
