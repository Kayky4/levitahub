import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToSession } from '../../services/regency';
import { getSong } from '../../services/songs';
import { RegencySession, Song } from '../../services/types';
import RealtimeCuePopup from '../../components/regency/RealtimeCuePopup';
import ChordRenderer from '../../components/regency/ChordRenderer';
import ConnectionStatus from '../../components/regency/ConnectionStatus';
import ViewerSettings from '../../components/regency/ViewerSettings';

// --- DEFAULT LOCAL SETTINGS ---
const DEFAULT_SETTINGS = {
  fontSize: 20, // px
  highContrast: true,
  lineHeight: 1.5
};

// Sync with Controller
const SPEED_LEVELS = [0.15, 0.4, 0.8, 1.5];

const RegencyViewer: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();

  // --- DATA STATE ---
  const [session, setSession] = useState<RegencySession | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [loadingSong, setLoadingSong] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // --- UX STATE ---
  const [isConnected, setIsConnected] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // --- SYNC STATE ---
  const [followLeader, setFollowLeader] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  
  // --- LOCAL SETTINGS (Persisted) ---
  const [localSettings, setLocalSettings] = useState(() => {
    const saved = localStorage.getItem('levitahub-viewer-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // --- REFS ---
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollInterval = useRef<number | null>(null);
  const scrollAccumulator = useRef<number>(0);

  // 1. Connect Logic & Latency
  useEffect(() => {
    if (!bandId) return;
    const unsubscribe = subscribeToSession(bandId, (newSession) => {
      setSession(newSession);
      setIsConnected(!!newSession?.isActive);
      
      if (newSession?.updatedAt) {
        const serverTime = new Date(newSession.updatedAt).getTime();
        const now = Date.now();
        setLatencyMs(Math.abs(now - serverTime)); 
      }
    });
    return () => unsubscribe();
  }, [bandId]);

  // 2. Song Fetching
  useEffect(() => {
    if (!bandId || !session?.currentSongId) {
      if (!song) setSong(null);
      return;
    }

    if (followLeader && session.currentSongId !== song?.id) {
      setLoadingSong(true);
      getSong(bandId, session.currentSongId)
        .then(setSong)
        .catch(console.error)
        .finally(() => setLoadingSong(false));
      
      setUserHasScrolled(false);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
  }, [bandId, session?.currentSongId, song?.id, followLeader]);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    localStorage.setItem('levitahub-viewer-settings', JSON.stringify(newSettings));
  };

  // 4. AUTO-SCROLL ENGINE
  useEffect(() => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }

    if (!session?.scrollState?.isPlaying || !followLeader || userHasScrolled) {
      scrollAccumulator.current = 0;
      return; 
    }

    // Get strict pixel value based on the speed index
    const speedIndex = session.scrollState.speed;
    const safeIndex = Math.min(Math.max(speedIndex, 0), SPEED_LEVELS.length - 1);
    const pxToAdd = SPEED_LEVELS[safeIndex];

    scrollInterval.current = window.setInterval(() => {
      if (containerRef.current) {
        scrollAccumulator.current += pxToAdd;

        if (scrollAccumulator.current >= 1) {
          const pixelsToMove = Math.floor(scrollAccumulator.current);
          containerRef.current.scrollTop += pixelsToMove;
          scrollAccumulator.current -= pixelsToMove;
        }
      }
    }, 16);

    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, [session?.scrollState, followLeader, userHasScrolled]);

  // 5. Section Snap
  useEffect(() => {
    if (!followLeader || userHasScrolled) return;

    if (session?.currentSectionIndex !== null && sectionRefs.current[session!.currentSectionIndex]) {
      sectionRefs.current[session!.currentSectionIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [session?.currentSectionIndex, followLeader]);

  const handleScrollInteraction = () => {
    if (followLeader && session?.scrollState.isPlaying) {
      setUserHasScrolled(true);
    }
  };

  const handleReSync = () => {
    setUserHasScrolled(false);
    setFollowLeader(true);
    
    if (session?.currentSongId && session.currentSongId !== song?.id) {
       setLoadingSong(true);
       getSong(bandId!, session.currentSongId)
        .then(setSong)
        .finally(() => setLoadingSong(false));
    }

    if (session?.currentSectionIndex !== null && sectionRefs.current[session!.currentSectionIndex]) {
      sectionRefs.current[session!.currentSectionIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  // 7. Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isConnected) {
        try {
          const s = await navigator.wakeLock.request('screen');
          setWakeLock(s);
        } catch (e) { console.warn(e); }
      }
    };
    requestWakeLock();
    return () => { wakeLock?.release(); };
  }, [isConnected]);

  if (!isConnected || !session?.isActive) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping mb-6"></div>
        <h1 className="text-2xl font-bold mb-2 tracking-tight">Aguardando Regência</h1>
        <p className="text-gray-500 text-sm mb-8">O líder ainda não iniciou a sessão.</p>
        <button onClick={() => navigate(`/band/${bandId}/dashboard`)} className="px-6 py-2 border border-gray-800 rounded-full text-gray-500 hover:text-white hover:border-gray-500 transition-all text-xs uppercase tracking-widest">
          Sair
        </button>
      </div>
    );
  }

  const bgColor = localSettings.highContrast ? 'bg-black' : 'bg-gray-900';
  const textColor = localSettings.highContrast ? 'text-white' : 'text-gray-200';
  const chordColor = localSettings.highContrast ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div className={`fixed inset-0 ${bgColor} ${textColor} font-sans flex flex-col overflow-hidden`}>
      <RealtimeCuePopup cue={session.cue} />
      <ViewerSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={localSettings}
        onUpdate={updateSetting}
      />

      {/* ZEN HEADER */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none transition-opacity duration-500 hover:opacity-100 opacity-0 sm:opacity-100">
         <div className="pointer-events-auto flex flex-col gap-1">
            <h1 className="text-xl md:text-3xl font-black tracking-tight leading-none shadow-black drop-shadow-md">
               {song?.title || (loadingSong ? "Carregando..." : "...")}
            </h1>
            {song && (
               <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-800/80 backdrop-blur px-2 py-0.5 rounded border border-gray-700">
                     <span className="text-[10px] text-gray-400 mr-1">TOM</span>
                     <span className={`text-sm font-bold ${chordColor}`}>
                        {song.key} {session.transposeAmount !== 0 && <span className="text-[10px] text-gray-400">({session.transposeAmount > 0 ? '+' : ''}{session.transposeAmount})</span>}
                     </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${latencyMs > 1000 ? 'bg-red-500' : latencyMs > 500 ? 'bg-yellow-500' : 'bg-green-500'}`} title={`Latência: ~${latencyMs}ms`} />
               </div>
            )}
         </div>
         
         <div className="pointer-events-auto flex gap-2">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 bg-gray-800/80 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <ConnectionStatus status="connected" />
         </div>
      </div>

      {/* MAIN CONTENT */}
      <div 
        ref={containerRef}
        onTouchMove={handleScrollInteraction}
        onWheel={handleScrollInteraction}
        className="flex-1 overflow-y-auto pt-32 pb-40 px-4 md:px-8 scroll-smooth relative z-10 no-scrollbar"
        style={{ scrollBehavior: session.scrollState.isPlaying && !userHasScrolled ? 'auto' : 'smooth' }}
      >
         {song ? (
            <div className="max-w-4xl mx-auto space-y-12 pb-[50vh]">
               {song.sections.map((section, idx) => {
                  const isActive = followLeader && idx === session.currentSectionIndex;
                  return (
                    <motion.div
                      key={section.id}
                      ref={(el) => { sectionRefs.current[idx] = el; }}
                      initial={{ opacity: 0.5 }}
                      animate={{ 
                        opacity: isActive ? 1 : 0.8, 
                        scale: isActive ? 1.02 : 1
                      }}
                      transition={{ duration: 0.4 }}
                      className={`origin-left transition-all duration-500 ${isActive ? 'pl-4 border-l-4 border-yellow-500' : 'pl-0 border-l-0 opacity-80 hover:opacity-100'}`}
                    >
                       <div className={`text-xs font-black uppercase tracking-widest mb-4 ${isActive ? 'text-indigo-400' : 'text-gray-600'}`}>
                          {section.name}
                       </div>
                       
                       <div style={{ fontSize: `${localSettings.fontSize}px`, lineHeight: localSettings.lineHeight }}>
                         <ChordRenderer 
                           content={section.content} 
                           transpose={session.transposeAmount} 
                           mode="viewer"
                         />
                       </div>
                    </motion.div>
                  );
               })}
            </div>
         ) : (
            <div className="h-full flex items-center justify-center text-gray-600 font-mono animate-pulse">
               {loadingSong ? "BAIXANDO PARTITURA..." : "AGUARDANDO SELEÇÃO..."}
            </div>
         )}
      </div>

      {/* SYNC STATUS FLOATER */}
      <AnimatePresence>
         {(!followLeader || userHasScrolled) && (
            <motion.div
               initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
               className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
               <button
                 onClick={handleReSync}
                 className="pointer-events-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2 uppercase text-sm tracking-wider transition-all active:scale-95"
               >
                  <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  {session.scrollState.isPlaying ? 'Sincronizar & Rolar' : 'Voltar ao Líder'}
               </button>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
};

export default RegencyViewer;