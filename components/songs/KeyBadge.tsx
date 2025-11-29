import React from 'react';
import { cn } from '../../lib/utils';

interface KeyBadgeProps {
  musicalKey: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Mapa de cores determinístico para tons
// C = Redish, D = Orange, E = Yellow, F = Green, G = Blue, A = Indigo, B = Purple
const getKeyColor = (k: string) => {
  const root = k.charAt(0).toUpperCase();
  switch (root) {
    case 'C': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    case 'D': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
    case 'E': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    case 'F': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'G': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    case 'A': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    case 'B': return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20';
    default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  }
};

const KeyBadge: React.FC<KeyBadgeProps> = ({ musicalKey, size = 'md', className }) => {
  const colorClass = getKeyColor(musicalKey);
  
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm"
  };

  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg font-mono font-bold border shadow-sm",
      colorClass,
      sizeClasses[size],
      className
    )}>
      {musicalKey || '?'}
    </div>
  );
};

export default KeyBadge;