import { forwardRef } from 'react';
import { ParticleCard } from './MagicBento';
import './MagicBento.css';

/**
 * AnimatedButton - Button component with MagicBento particle effects
 * @param {Object} props - Button properties
 * @param {string} props.children - Button text content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Button variant: primary, secondary, small
 * @param {boolean} props.disabled - Disabled state
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.enableParticles - Enable particle animation (default: true)
 * @param {boolean} props.enableGlow - Enable glow effect (default: true)
 * @param {boolean} props.enableTilt - Enable tilt effect on hover (default: true)
 */
export const AnimatedButton = forwardRef(({
  children,
  className = '',
  variant = 'primary',
  disabled = false,
  onClick,
  enableParticles = true,
  enableGlow = true,
  enableTilt = true,
  ...props
}, ref) => {
  const variantClasses = {
    primary: 'px-8 py-3 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white font-semibold rounded-lg shadow-lg',
    secondary: 'px-8 py-3 bg-turquoise-500 hover:bg-turquoise-600 text-white font-semibold rounded-lg shadow-lg',
    small: 'px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold rounded-lg'
  };

  const buttonClasses = `
    ${variantClasses[variant] || variantClasses.primary}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
    transition-all duration-300
    transform hover:scale-105
  `.trim();

  return (
    <ParticleCard
      ref={ref}
      className={`inline-block ${buttonClasses}`}
      disableAnimations={!enableParticles}
      enableTilt={enableTilt}
      clickEffect={true}
      enableMagnetism={enableGlow}
      glowColor={variant === 'primary' ? '255, 107, 107' : variant === 'secondary' ? '78, 205, 196' : '255, 230, 109'}
      {...props}
    >
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled}
        onClick={onClick}
        style={{ background: 'transparent', border: 'none', cursor: 'inherit' }}
      >
        {children}
      </button>
    </ParticleCard>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

/**
 * AnimatedCard - Card component with MagicBento effects
 */
export const AnimatedCard = forwardRef(({
  children,
  className = '',
  enableParticles = true,
  enableGlow = true,
  enableTilt = false,
  title,
  ...props
}, ref) => {
  return (
    <ParticleCard
      ref={ref}
      className={`p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/20 ${className}`}
      disableAnimations={!enableParticles}
      enableTilt={enableTilt}
      clickEffect={true}
      enableMagnetism={enableGlow}
      glowColor="132, 0, 255"
      {...props}
    >
      {title && <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>}
      <div className="text-gray-100">
        {children}
      </div>
    </ParticleCard>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

export { ParticleCard, MagicBento } from './MagicBento';
export { default } from './MagicBento';
