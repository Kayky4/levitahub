import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  noPadding?: boolean;
  delay?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  onClick, 
  hoverable = false, 
  noPadding = false,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={hoverable ? { scale: 1.01, y: -2 } : {}}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        // Light Mode Styles
        "bg-white border border-gray-200 shadow-sm",
        // Dark Mode Styles (Glassmorphism)
        "dark:bg-white/[0.02] dark:border-white/5 dark:backdrop-blur-md dark:shadow-2xl dark:ring-1 dark:ring-white/10",
        // Hover State
        hoverable && "cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:bg-white/[0.04] dark:hover:ring-white/20 dark:hover:shadow-indigo-500/10",
        className
      )}
    >
      {/* Inner Glow Gradient (Dark Mode Only) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none opacity-0 dark:opacity-100" />
      
      <div className={cn("relative z-10", !noPadding && "p-6")}>
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;