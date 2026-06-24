import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'ML Playground', path: '/ml-prediction' },
    { name: 'Dashboard', path: '/dashboard' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl bg-white/80 backdrop-blur-xl border border-purple-100 rounded-2xl shadow-lg shadow-purple-950/5 px-6 py-3 transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          {/* LOGO LEFT */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10">
              <span className="text-white font-bold text-lg">🧬</span>
            </div>
            <span className="text-[#2D1B69] font-black text-xl tracking-wider uppercase font-mono">
              Learn<span className="text-[#8B5CF6]">AI</span>
            </span>
          </Link>

          {/* NAVIGATION CENTER */}
          <div className="hidden md:flex gap-4 items-center relative">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-bold tracking-wide text-sm transition-all duration-300 relative py-1.5 px-3 rounded-lg ${
                  isActive(link.path)
                    ? 'text-[#6D28D9] bg-purple-50/60'
                    : 'text-slate-600 hover:text-[#6D28D9] hover:bg-purple-50/30'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#6D28D9] rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* CTA & HAMBURGER RIGHT */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:block"
            >
              <Link
                to="/login"
                className="px-5 py-2 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:brightness-105 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-purple-500/10 transition-all animate-fadeIn"
              >
                Login / Get Started
              </Link>
            </motion.div>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 md:hidden text-[#2D1B69] hover:bg-purple-50 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pt-4 border-t border-purple-100 flex flex-col gap-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`font-bold tracking-wide text-sm py-2 px-3 rounded-lg transition-all ${
                  isActive(link.path)
                    ? 'text-[#6D28D9] bg-purple-50'
                    : 'text-slate-600 hover:text-[#6D28D9] hover:bg-purple-50/50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="mt-2 w-full text-center py-2.5 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all"
            >
              Login / Get Started
            </Link>
          </motion.div>
        )}
      </motion.nav>
    </div>
  );
};

export const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-t border-purple-100 text-slate-600 py-12"
    >
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-black text-[#2D1B69] text-lg mb-4">LearnAI</h3>
            <p className="text-slate-500 font-semibold text-sm">
              Helping every child learn better with AI-powered detection.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[#2D1B69] mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-500 text-sm font-semibold">
              <li><a href="/" className="hover:text-[#6D28D9] transition">Home</a></li>
              <li><a href="#" className="hover:text-[#6D28D9] transition">Features</a></li>
              <li><a href="#" className="hover:text-[#6D28D9] transition">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#2D1B69] mb-4">Support</h4>
            <ul className="space-y-2 text-slate-500 text-sm font-semibold">
              <li><a href="#" className="hover:text-[#6D28D9] transition">Help Center</a></li>
              <li><a href="#" className="hover:text-[#6D28D9] transition">FAQ</a></li>
              <li><a href="#" className="hover:text-[#6D28D9] transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#2D1B69] mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-500 text-sm font-semibold">
              <li><a href="#" className="hover:text-[#6D28D9] transition">Privacy</a></li>
              <li><a href="#" className="hover:text-[#6D28D9] transition">Terms</a></li>
              <li><a href="#" className="hover:text-[#6D28D9] transition">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-purple-100 pt-8 text-center text-slate-400 text-sm font-semibold">
          <p>&copy; 2026 LearnAI. All rights reserved.</p>
        </div>
      </div>
    </motion.footer>
  );
};

export const FeatureCard = ({ icon, title, description, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.03 }}
      className="card text-center card-hover"
    >
      <div className="text-6xl mb-4 filter drop-shadow-sm">{icon}</div>
      <h3 className="text-xl font-black text-[#2D1B69] mb-3">{title}</h3>
      <p className="text-slate-500 font-semibold text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

export const TestimonyCard = ({ quote, author, role, avatar, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90 }}
      whileInView={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="card card-hover"
    >
      <div className="flex gap-1.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-[#8B5CF6] text-sm">⭐</span>
        ))}
      </div>
      <p className="text-slate-600 mb-6 text-base italic font-semibold leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center text-xl shadow-md">
          {avatar}
        </div>
        <div className="text-left">
          <p className="font-black text-[#2D1B69] text-sm">{author}</p>
          <p className="text-xs text-slate-500 font-bold">{role}</p>
        </div>
      </div>
    </motion.div>
  );
};
