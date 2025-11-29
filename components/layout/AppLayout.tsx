import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getBandBilling } from '../../services/billing';
import CommandPalette from '../ui/CommandPalette';
import ThemeToggle from '../ui/ThemeToggle';

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

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Plus Badge State
  const [isPlusActive, setIsPlusActive] = useState(false);

  // --- CONTEXT DETECTION LOGIC ---
  // Detect if we are inside a specific band context
  const bandIdMatch = location.pathname.match(/^\/band\/([^\/]+)/);
  const rawBandId = bandIdMatch ? bandIdMatch[1] : null;
  // Ensure 'create' and 'join' are not treated as Band IDs
  const currentBandId = (rawBandId === 'create' || rawBandId === 'join') ? null : rawBandId;

  // Keyboard shortcuts (Keep Cmd+K functionality hidden)
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

  // Click outside to close profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Check for Active Subscription in current Band Context
  useEffect(() => {
    const checkBillingStatus = async () => {
      if (currentBandId) {
        try {
          const billing = await getBandBilling(currentBandId);
          if (billing && (billing.subscriptionStatus === 'active' || billing.subscriptionStatus === 'trialing')) {
            setIsPlusActive(true);
          } else {
            setIsPlusActive(false);
          }
        } catch (error) {
          setIsPlusActive(false);
        }
      } else {
        setIsPlusActive(false);
      }
    };

    checkBillingStatus();
  }, [currentBandId]);

  // Hide Navbar on Auth pages AND Regency Mode pages
  const isRegency = location.pathname.includes('/regency');
  const hideNavbar = ['/', '/signup'].includes(location.pathname) || isRegency;

  // Helper styles for nav links - increased padding
  const navLinkStyle = "px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors min-h-[44px] flex items-center";
  
  // Mobile nav style - larger touch target
  const mobileNavLinkStyle = "block px-4 py-4 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors min-h-[56px] flex items-center";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 text-gray-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      <CommandPalette isOpen={isCmdOpen} setIsOpen={setIsCmdOpen} />
      
      {!hideNavbar && user && (
        <nav className="border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo Area */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
                  <div className="h-10 w-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
                     <span className="font-bold text-white text-lg">L</span>
                  </div>
                  <div className="hidden sm:block relative">
                    <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white block leading-none">
                      LevitaHub
                      {isPlusActive && (
                        <sup className="ml-1 align-top text-[9px] font-black tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                          PLUS
                        </sup>
                      )}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">Beta</span>
                  </div>
                </div>

                {/* Desktop Navbar Menus - CONTEXTUAL */}
                <div className="hidden md:flex items-center gap-1 ml-4">
                  {currentBandId ? (
                    /* Band Context Menu */
                    <>
                      <Link to="/dashboard" className={navLinkStyle}>
                        Início
                      </Link>
                      <Link to={`/band/${currentBandId}/songs`} className={navLinkStyle}>
                        Músicas
                      </Link>
                      <Link to={`/band/${currentBandId}/playlists`} className={navLinkStyle}>
                        Eventos
                      </Link>
                      <Link to={`/band/${currentBandId}/members`} className={navLinkStyle}>
                        Equipe
                      </Link>
                    </>
                  ) : (
                    /* Global Context Menu (Empty as requested) */
                    null
                  )}
                </div>
              </div>
              
              {/* Right Actions Area */}
              <div className="flex items-center gap-3 sm:gap-4">
                
                {/* Mobile Menu Button - Only show if there are menu items */}
                {currentBandId && (
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 focus:outline-none transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
                    aria-label="Menu"
                  >
                    {isMobileMenuOpen ? (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Theme Toggle */}
                <ThemeToggle />

                <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <div 
                    className="flex items-center gap-3 pl-2 cursor-pointer group min-h-[44px]" 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <div className="hidden md:flex flex-col items-end">
                       <span className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {user.displayName}
                       </span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 border border-gray-300 dark:border-white/10 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300 ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all shadow-lg">
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-midnight-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                       <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 md:hidden">
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Logado como</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p>
                       </div>
                       
                       <Link 
                         to="/profile" 
                         className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white transition-colors min-h-[48px] flex items-center"
                         onClick={() => setIsProfileMenuOpen(false)}
                       >
                         Meu Perfil
                       </Link>
                       
                       <div className="border-t border-gray-100 dark:border-white/5 my-1"></div>
                       
                       <button 
                         onClick={() => {
                           setIsProfileMenuOpen(false);
                           signOutUser();
                         }}
                         className="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors min-h-[48px] flex items-center"
                       >
                         Sair
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu (Contextual) */}
          {isMobileMenuOpen && currentBandId && (
            <div className="md:hidden bg-white dark:bg-midnight-900 border-t border-gray-200 dark:border-white/10 animate-in slide-in-from-top-2 duration-200 absolute w-full left-0 z-40 shadow-xl">
              <div className="px-4 py-3 space-y-2">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileNavLinkStyle}
                >
                  🏠 Início
                </Link>
                <Link
                  to={`/band/${currentBandId}/songs`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileNavLinkStyle}
                >
                  🎵 Músicas
                </Link>
                <Link
                  to={`/band/${currentBandId}/playlists`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileNavLinkStyle}
                >
                  📅 Eventos
                </Link>
                <Link
                  to={`/band/${currentBandId}/members`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileNavLinkStyle}
                >
                  👥 Equipe
                </Link>
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="relative min-h-[calc(100vh-64px)]">
         {children}
      </main>
    </div>
  );
};

export default AppLayout;