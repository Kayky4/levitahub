import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, helperText, rightElement, className = '', id, ...props }) => {
  const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

  // Increased padding (py-3.5) and added min-height (h-12) for better touch area
  const baseStyles = "appearance-none block w-full px-4 py-3.5 min-h-[48px] border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-all duration-200";
  
  // Responsive Styles for Light/Dark modes
  const responsiveStyles = "bg-white dark:bg-gray-800 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-500/50 dark:focus:bg-gray-700";

  const errorStyles = "border-red-500/50 text-red-900 dark:text-red-200 placeholder-red-300 focus:ring-red-500/50 focus:border-red-500";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`
            ${baseStyles}
            ${error ? errorStyles : responsiveStyles}
            ${rightElement ? 'pr-12' : ''} 
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400 ml-1">{error}</p>}
      {!error && helperText && <p className="mt-1 text-sm text-gray-500 ml-1">{helperText}</p>}
    </div>
  );
};

export default Input;