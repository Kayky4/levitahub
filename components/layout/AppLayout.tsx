import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import CommandPalette from '../ui/CommandPalette';
import ThemeToggle from '../ui/ThemeToggle';
import BandSwitcher from './BandSwitcher';
import BottomNav from './BottomNav';

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = ({ children }) => {
  const { user, signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  
  // Profile Dropdown State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // --- CONTEXT DETECTION LOGIC ---
  const bandIdMatch = location.pathname.match(/^\/band\/([^\/]+)/);
  const rawBandId = bandIdMatch ? bandIdMatch[1] : null;
  const currentBandId = (rawBandId === 'create' || rawBandId === 'join') ? null : rawBandId;

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCmdOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Click outside profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pages where nav is hidden
  const isRegency = location.pathname.includes('/regency');
  const hideNavbar = ['/', '/signup'].includes(location.pathname) || isRegency;

  // Desktop Nav Link Style (Tabs)
  const desktopNavLinkStyle = ({ isActive }: { isActive: boolean }) => `
    px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
    ${isActive 
      ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-sm' 
      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
    }
  `;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 text-gray-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      <CommandPalette isOpen={isCmdOpen} setIsOpen={setIsCmdOpen} />
      
      {!hideNavbar && user && (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/80 dark:border-white/5 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-xl transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              
              {/* LEFT: Logo & Context Switcher */}
              <div className="flex items-center gap-6">
                {/* Full Logo (Icon + Text) */}
                <div 
                  className="flex items-center gap-2 cursor-pointer group" 
                  onClick={() => navigate('/dashboard')}
                >
                  <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                     <span className="font-black text-white text-lg leading-none">L</span>
                  </div>
                  <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white leading-none">
                    LevitaHub
                  </span>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>

                {/* Band Switcher (Context) */}
                <BandSwitcher />
              </div>
              
              {/* RIGHT: System & Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                
                {/* Desktop Navigation Tabs (Only visible on Desktop and if inside a band) */}
                {currentBandId && (
                  <div className="hidden lg:flex items-center gap-1 mr-4 bg-gray-100/50 dark:bg-white/5 p-1 rounded-full border border-gray-200 dark:border-white/5">
                    <NavLink to={`/band/${currentBandId}/dashboard`} className={desktopNavLinkStyle}>Início</NavLink>
                    <NavLink to={`/band/${currentBandId}/songs`} className={desktopNavLinkStyle}>Músicas</NavLink>
                    <NavLink to={`/band/${currentBandId}/playlists`} className={desktopNavLinkStyle}>Eventos</NavLink>
                    <NavLink to={`/band/${currentBandId}/members`} className={desktopNavLinkStyle}>Equipe</NavLink>
                  </div>
                )}

                <ThemeToggle />

                {/* Profile Dropdown */}
                <div className="relative ml-1" ref={profileMenuRef}>
                  <button 
                    className="flex items-center gap-2 focus:outline-none" 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 ring-2 ring-transparent hover:ring-indigo-500/50 transition-all">
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1A1F2E] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 py-1 overflow-hidden z-50 origin-top-right"
                      >
                         <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Conectado como</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                         </div>
                         
                         <div className="p-1">
                           <Link 
                             to="/profile" 
                             className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                             onClick={() => setIsProfileMenuOpen(false)}
                           >
                             <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                             Meu Perfil
                           </Link>
                           
                           {/* Only show Settings in Global Context for now */}
                           <button 
                             className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed"
                             title="Em breve"
                           >
                             <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             Configurações
                           </button>
                         </div>
                         
                         <div className="h-px bg-gray-100 dark:bg-white/5 mx-2 my-1"></div>
                         
                         <div className="p-1">
                           <button 
                             onClick={() => {
                               setIsProfileMenuOpen(false);
                               signOutUser();
                             }}
                             className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                             Sair
                           </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={`relative ${!hideNavbar ? 'pt-16' : ''} ${currentBandId ? 'pb-24 md:pb-0' : ''}`}>
         {children}
      </main>

      {/* Mobile Bottom Navigation (Only when inside a band) */}
      {!hideNavbar && currentBandId && (
        <BottomNav bandId={currentBandId} />
      )}
    </div>
  );
};

export default AppLayout;