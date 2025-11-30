
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserBands } from '../../services/bands';
import { useAuth } from '../../hooks/useAuth';

interface BandOption {
  id: string;
  name: string;
  role: string;
}

const BandSwitcher: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [bands, setBands] = useState<BandOption[]>([]);
  const [currentBand, setCurrentBand] = useState<BandOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect current band from URL
  const bandIdMatch = location.pathname.match(/^\/band\/([^\/]+)/);
  const currentBandId = (bandIdMatch && bandIdMatch[1] !== 'create' && bandIdMatch[1] !== 'join') ? bandIdMatch[1] : null;

  useEffect(() => {
    if (!user) return;
    
    const fetchBands = async () => {
      const userBands = await getUserBands();
      const formattedBands = Object.entries(userBands).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        role: data.role
      }));
      setBands(formattedBands);

      if (currentBandId) {
        const found = formattedBands.find(b => b.id === currentBandId);
        setCurrentBand(found || null);
      } else {
        setCurrentBand(null);
      }
    };

    fetchBands();
  }, [user, currentBandId]);

  // Close click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (bandId: string) => {
    setIsOpen(false);
    navigate(`/band/${bandId}/dashboard`);
  };

  const handleGoHome = () => {
    setIsOpen(false);
    navigate('/dashboard');
  };

  const handleCreate = () => {
    setIsOpen(false);
    navigate('/band/create');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group max-w-[200px] sm:max-w-[260px]"
      >
        <div className={`
          h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm transition-transform group-hover:scale-105
          ${currentBand 
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
            : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
          }
        `}>
          {currentBand ? currentBand.name.charAt(0).toUpperCase() : 'L'}
        </div>
        
        <div className="flex flex-col items-start overflow-hidden">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate w-full leading-none">
            {currentBand ? currentBand.name : 'Visão Geral'}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full leading-none mt-0.5">
            {currentBand ? 'Mudar banda...' : 'Selecionar ministério...'}
          </span>
        </div>

        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ml-auto shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1.5">
                Meus Ministérios
              </div>
              
              <button 
                onClick={handleGoHome}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors mb-1
                  ${!currentBand ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}
                `}
              >
                <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </div>
                Visão Geral
                {!currentBand && <span className="ml-auto text-indigo-500">✓</span>}
              </button>

              <div className="space-y-0.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                {bands.map((band) => (
                  <button
                    key={band.id}
                    onClick={() => handleSwitch(band.id)}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors
                      ${currentBand?.id === band.id 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }
                    `}
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                      {band.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-start truncate">
                      <span className="truncate w-full">{band.name}</span>
                      <span className="text-[10px] opacity-70 uppercase tracking-wide">{band.role}</span>
                    </div>
                    {currentBand?.id === band.id && <span className="ml-auto text-indigo-500">✓</span>}
                  </button>
                ))}
              </div>

              <div className="h-px bg-gray-100 dark:bg-white/5 my-2"></div>

              <button 
                onClick={handleCreate}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg border border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                Criar Nova Banda
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BandSwitcher;
