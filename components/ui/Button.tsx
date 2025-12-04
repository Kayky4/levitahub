import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  className = '',
  disabled,
  ...props
}) => {

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-500/50",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 backdrop-blur-sm",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40",
    ghost: "text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5",
    outline: "border-2 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
  };

  const sizes = {
    // Increased min-heights for better touch targets
    sm: "px-4 py-2 text-xs rounded-lg min-h-[38px]",
    md: "px-6 py-3 text-sm rounded-xl min-h-[48px]",
    lg: "px-8 py-4 text-base rounded-xl min-h-[56px]"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-midnight-900 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;