import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    small: 'btn-small',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-4 text-lg',
    lg: 'px-12 py-5 text-xl',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`${variants[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const InputField = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {label && (
        <label className="block text-slate-300 font-semibold mb-3 text-lg">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`input-field ${error ? 'border-error' : ''} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {error && (
        <p className="text-error text-sm font-medium mt-2">{error}</p>
      )}
    </motion.div>
  );
};

export const Card = ({
  children,
  className = '',
  hover = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -10 } : {}}
      transition={{ duration: 0.5 }}
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ProgressBar = ({
  current,
  total,
  color = 'from-primary to-secondary',
}) => {
  const percentage = (current / total) * 100;

  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`h-3 rounded-full bg-gradient-to-r ${color} shadow-soft`}
    />
  );
};

export const Timer = ({ seconds, isActive = true }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      className="text-3xl font-bold text-primary"
      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, repeat: Infinity }}
    >
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </motion.div>
  );
};

export const Loader = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} border-4 border-light border-t-primary rounded-full`}
    />
  );
};

export const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  return (
    <span
      className={`${variants[variant]} text-white px-4 py-2 rounded-full text-sm font-bold ${className}`}
    >
      {children}
    </span>
  );
};
