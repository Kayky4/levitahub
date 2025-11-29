import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text', width, height }) => {
  const base = "animate-pulse bg-gray-200";
  const variants = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-md"
  };

  return (
    <div 
      className={`${base} ${variants[variant]} ${className}`} 
      style={{ width, height }}
    />
  );
};

export default Skeleton;