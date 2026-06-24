import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexts/AppContext';
import '../styles/AuthPages.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { updateAuthToken, setCurrentUser, showError, showSuccess } = useAppContext();
  
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Predefined Google Accounts for easy testing and persistence validation
  const presetAccounts = [
    { email: 'jane.doe@gmail.com', name: 'Jane Doe', avatar: '👩‍⚕️' },
    { email: 'alex.smith@gmail.com', name: 'Alex Smith', avatar: '👨‍💼' },
    { email: 'sarah.connor@gmail.com', name: 'Sarah Connor', avatar: '👩‍🚀' },
  ];

  const handleGoogleLogin = async (email, fullName) => {
    if (!email || !fullName) {
      showError('Please enter both email and name.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Google login failed');
        return;
      }

      // Store auth info (automatically sets parent role to access assessment triggers)
      updateAuthToken(data.token);
      setCurrentUser(data.user);

      showSuccess(`Logged in as ${data.user.full_name}!`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      showError('Error connecting to authentication server');
      console.error('Google login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10 text-slate-600">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-r from-[#5B21B6] to-[#8B5CF6] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-purple-500/25"
          >
            🧠
          </motion.div>
          <h1 className="text-3xl font-black text-[#2D1B69] tracking-tight mb-2 font-sans">
            Welcome to LearnAI
          </h1>
          <p className="text-slate-500 font-bold text-sm">
            Sign in with Google to access student assessments and reports
          </p>
        </div>

        {/* MOCK GOOGLE LOGIN CARD AREA */}
        <div className="space-y-6">
          {!showCustomForm ? (
            <>
              {/* Preconfigured Test Accounts */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-[#6B7280] mb-1">
                  Choose a Google Account to test:
                </label>
                {presetAccounts.map((account) => (
                  <motion.button
                    key={account.email}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoogleLogin(account.email, account.name)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-4 p-4 border border-purple-100 rounded-2xl bg-purple-50 hover:bg-purple-100/50 hover:border-purple-300 hover:shadow-purple-500/5 transition-all text-left disabled:opacity-50 cursor-pointer"
                  >
                    <div className="text-2xl w-10 h-10 rounded-full bg-white flex items-center justify-center filter drop-shadow-sm border border-purple-100">
                      {account.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-[#2D1B69] text-sm">{account.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{account.email}</p>
                    </div>
                    <div className="w-5 h-5 text-slate-400 font-bold">➜</div>
                  </motion.button>
                ))}
              </div>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-purple-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-black uppercase">Or</span>
                <div className="flex-grow border-t border-purple-100"></div>
              </div>

              {/* Button to show Custom Account Input */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCustomForm(true)}
                disabled={isLoading}
                className="btn-secondary w-full py-3.5 px-4 flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69a5.74 5.74 0 0 1-2.5 3.77v3.13h3.99c2.34-2.16 3.68-5.32 3.68-9.03z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.99-3.13a7.18 7.18 0 0 1-10.7-3.8H1.18v3.23A12 12 0 0 0 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.16a7.2 7.2 0 0 1 0-4.32V6.6H1.18a12 12 0 0 0 0 10.8l4.09-3.24z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A12 12 0 0 0 1.18 6.6l4.09 3.24a7.2 7.2 0 0 1 6.73-5.09z"
                  />
                </svg>
                Sign in with another Google Account
              </motion.button>
            </>
          ) : (
            <AnimatePresence>
              <motion.form
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGoogleLogin(customEmail, customName);
                }}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="block text-sm font-bold text-[#6B7280] mb-1">
                    Google Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="input-field py-3 text-sm"
                    placeholder="e.g. John Doe"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#6B7280] mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="input-field py-3 text-sm"
                    placeholder="e.g. john.doe@gmail.com"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex-1 py-3 text-sm cursor-pointer"
                  >
                    {isLoading ? 'Connecting...' : 'Authorize Login'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomEmail('');
                      setCustomName('');
                    }}
                    disabled={isLoading}
                    className="btn-secondary py-3 text-sm cursor-pointer"
                  >
                    Back
                  </motion.button>
                </div>
              </motion.form>
            </AnimatePresence>
          )}
        </div>

        {/* Security / Info footnote */}
        <div className="mt-8 text-center text-xs text-slate-500">
          🔒 Secured Google Sign-In Sandbox. History loads automatically by matching emails.
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
