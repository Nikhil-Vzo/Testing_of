import React from 'react';
import { Loader2 } from 'lucide-react';

export const NeonButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', className = '', isLoading, disabled }) => {
  const baseStyles = "relative px-6 py-3 rounded-full font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-neon text-white shadow-neon hover:shadow-[0_0_20px_#ff007f] hover:scale-105 border border-transparent",
    secondary: "bg-transparent border-2 border-neon text-neon hover:bg-neon hover:text-white hover:shadow-neon",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg",
    ghost: "bg-transparent text-gray-400 hover:text-white"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const NeonInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      className={`w-full bg-gray-900 border-2 border-gray-800 focus:border-neon text-white px-4 py-3 rounded-xl outline-none transition-all duration-300 focus:shadow-neon-sm placeholder-gray-600 ${props.className}`}
    />
  );
};

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300 font-medium">
    {children}
  </span>
);
