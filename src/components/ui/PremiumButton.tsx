import React from 'react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export function PremiumButton({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}: PremiumButtonProps) {
  
  const baseStyles = "relative inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 rounded-full px-8 py-3.5 overflow-hidden group";
  
  const variants = {
    primary: "bg-brand-gold text-brand-void hover:bg-brand-gold-light gold-glow hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]",
    secondary: "bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-brand-gold/50",
    outline: "bg-transparent text-brand-gold border border-brand-gold/50 hover:bg-brand-gold/10",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {/* Shine effect on hover */}
      <span className="absolute inset-0 w-full h-full -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></span>
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}
