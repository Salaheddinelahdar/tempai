import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'action' | 'secondary';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles matching the spec: 48px height, rounded-xl (12px), bold, shadow
  const baseStyles = "relative h-12 rounded-xl font-bold text-base transition-all transform active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg";

  const variants = {
    // Primary (GPS) - Solid Blue
    primary: "bg-primary hover:bg-blue-600 text-white shadow-blue-500/30 hover:shadow-blue-500/40",
    // Action (AI) - Purple Gradient
    action: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02]",
    // Secondary - Neutral
    secondary: "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700 shadow-none"
  };

  const widthClass = fullWidth ? 'w-full' : 'min-w-[160px] px-6';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && <span className="flex items-center justify-center w-5 h-5">{icon}</span>}
          <span className="truncate">{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;