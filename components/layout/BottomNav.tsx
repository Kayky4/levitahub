
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface Props {
  bandId: string;
}

const BottomNav: React.FC<Props> = ({ bandId }) => {
  const location = useLocation();

  const navItems = [
    { 
      path: `/band/${bandId}/dashboard`, 
      label: 'Início', 
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      path: `/band/${bandId}/songs`, 
      label: 'Músicas', 
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      )
    },
    { 
      path: `/band/${bandId}/playlists`, 
      label: 'Eventos', 
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      path: `/band/${bandId}/members`, 
      label: 'Equipe', 
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-midnight-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 z-50 pb-safe transition-all duration-300">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // Check if active (handle sub-routes like /songs/create)
          const isActive = location.pathname.startsWith(item.path) || (item.path.endsWith('/dashboard') && location.pathname === item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive: linkActive }) => `
                flex flex-col items-center justify-center w-full h-full space-y-1
                transition-all duration-200 active:scale-90
                ${linkActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
              `}
            >
              {item.icon(isActive)}
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
