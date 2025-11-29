import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
        ${hoverable ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className={noPadding ? '' : 'p-5 sm:p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;