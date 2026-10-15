import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon = null,
  iconPosition = 'left'
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold font-display rounded-full transition-all duration-150 ease-spring transform-gpu will-change-transform touch-fast focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95';

  const variants = {
    // Vibrant Teal (like WonderLearn's "Join Now")
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-pill hover:shadow-lg hover:shadow-brand-500/25 border-2 border-brand-400/30',
    // Golden Sun Yellow (like WonderLearn's "Start Exploring" & "Log In")
    sun: 'bg-sun-500 hover:bg-sun-600 text-amber-950 shadow-sun hover:shadow-lg hover:shadow-sun-500/30 border-2 border-sun-300',
    // Secondary White Pill (like WonderLearn's pill buttons)
    secondary: 'bg-white hover:bg-sky-50 text-slate-700 hover:text-brand-700 border-2 border-slate-200 hover:border-brand-300 shadow-sm',
    // Soft Sky Blue
    sky: 'bg-sky-100 hover:bg-sky-200 text-sky-800 border-2 border-sky-300/50',
    // Soft Mint
    mint: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-2 border-emerald-300/50',
    // Ghost
    ghost: 'bg-transparent hover:bg-slate-100/70 text-slate-700',
    // Danger
    danger: 'bg-coral-500 hover:bg-coral-600 text-white shadow-md'
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-7 py-3.5 gap-2.5 shadow-md'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
