
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { startSession, endSession, setCurrentSong, setCurrentSection, sendCue, setTranspose, canControlRegency, subscribeToSession, toggleScrollPlay, setScrollSpeed } from '../../services/regency';
import { getBandMembers } from '../../services/bands';
import { getBandBilling, canUseFeature } from '../../services/billing';
import { getPlaylist, updatePlaylistOrder } from '../../services/playlists';
import { getSong, getBandSongs } from '../../services/songs';
import { useAuth } from '../../hooks/useAuth';
import { Playlist, Song } from '../../services/types';
import Modal from '../../components/ui/Modal';
import ConnectionStatus from '../../components/regency/ConnectionStatus';
import ChordRenderer from '../../components/regency/ChordRenderer';
import { useToast } from '../../context/ToastContext';

const PRESET_CUES = ["VOLTA!", "SOBE TOM", "DESCE TOM", "IMPROVISO", "SEGURA", "ENTRA FORTE", "INSTRUMENTAL", "ACABOU"];

// Speed levels in pixels per tick (approx 16ms)
const SPEED_LEVELS = [0.15, 0.4, 0.8, 1.5];
const SPEED_LABELS = ["1x", "2x", "3x", "4x"];

// Color Palette for Chords
const CHORD_COLORS = [
  { id: 'red', class: 'text-red-600', label: 'Vermelho (Padrão)' },
  { id: 'blue', class: 'text-blue-600', label: 'Azul' },
  { id: 'green', class: 'text-green-600', label: 'Verde' },
  { id: 'orange', class: 'text-orange-500', label: 'Laranja' },
  { id: 'purple', class: 'text-purple-600', label: 'Roxo' },
];

const RegencyController: React.FC = () => {
  const { bandId, playlistId } = useParams<{ bandId: string; playlistId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Data State
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentSongData, setCurrentSongData] = useState<Song | null>(null);
  const [allBandSongs, setAllBandSongs] = useState<Song[]>([]);
  
  // Session State (Synced)
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const [transposeAmount, setTransposeAmount] = useState(0);
  const [scrollState, setScrollState] = useState({ isPlaying: false, speed: 1 });
  
  // UI State
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'blocked'>('loading');
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isCuesOpen, setIsCuesOpen] = useState(false);
  const [customCue, setCustomCue] = useState('');
  
  // Features
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    fontSize: 'lg',
    chordColor: 'text-red-600',
    highContrast: false,
    columns: 1
  });

  // Refs
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollInterval = useRef<number | null>(null);
  const scrollAccumulator = useRef<number>(0);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = "Sessão ativa. Sair irá desconectar os músicos.";
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 1. Initialization
  useEffect(() => {
    if (!bandId || !user) return;
    const init = async () => {
      try {
        const [billing, members] = await Promise.all([
          getBandBilling(bandId),
          getBandMembers(bandId)
        ]);

        if (!billing || !canUseFeature('regency', billing.subscriptionStatus)) {
          setStatus('blocked');
          return;
        }

        const me = members.find(m => m.userId === user.uid);
        if (!me || !canControlRegency(me.role)) {
          alert("Apenas Líder, Vice ou Regente podem iniciar uma sessão.");
          navigate(`/band/${bandId}/dashboard`);
          return;
        }

        let pl: Playlist | null = null;
        let initialSongId: string | undefined = undefined;

        if (playlistId) {
          pl = await getPlaylist(bandId, playlistId);
          setPlaylist(pl);
          if (pl && pl.songs.length > 0) {
            initialSongId = pl.songs[0].songId;
          }
        }
        
        const { created, session } = await startSession(bandId, playlistId, initialSongId);
        
        if (session) {
          setActiveSongId(session.currentSongId);
          setActiveSectionIndex(session.currentSectionIndex);
          setTransposeAmount(session.transposeAmount);
          setScrollState(session.scrollState || { isPlaying: false, speed: 1 });

          if (!created && session.playlistId && !pl) {
             const recoveredPl = await getPlaylist(bandId, session.playlistId);
             setPlaylist(recoveredPl);
          }
        }

        setStatus('ready');
        getBandSongs(bandId).then(setAllBandSongs);

      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };
    init();
  }, [bandId, playlistId, user, navigate]);

  // 2. Sync Listener
  useEffect(() => {
    if (!bandId) return;
    const unsubscribe = subscribeToSession(bandId, (session) => {
      if (session && session.isActive) {
        if (session.currentSongId !== activeSongId) setActiveSongId(session.currentSongId);
        if (session.currentSectionIndex !== activeSectionIndex) setActiveSectionIndex(session.currentSectionIndex);
        if (session.transposeAmount !== transposeAmount) setTransposeAmount(session.transposeAmount || 0);
        
        if (session.scrollState) {
           setScrollState(prev => {
             if (prev.isPlaying !== session.scrollState.isPlaying || prev.speed !== session.scrollState.speed) {
               return session.scrollState;
             }
             return prev;
           });
        }
      } else if (session && !session.isActive && status === 'ready') {
        alert("A sessão foi encerrada.");
        navigate(`/band/${bandId}/dashboard`);
      }
    });
    return () => unsubscribe();
  }, [bandId, status, activeSongId, activeSectionIndex, transposeAmount]); 

  // 3. Load Song
  useEffect(() => {
    if (!bandId || !activeSongId) {
      if (!activeSongId) setCurrentSongData(null);
      return;
    }
    if (currentSongData?.id !== activeSongId) {
      setCurrentSongData(null);
      getSong(bandId, activeSongId)
        .then(setCurrentSongData)
        .catch(console.error);
    }
  }, [bandId, activeSongId]);

  // 4. Auto-Scroll
  useEffect(() => {
    if (scrollInterval.current) {
      window.clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }

    if (!scrollState.isPlaying) {
      scrollAccumulator.current = 0;
      return;
    }

    const interval = window.setInterval(() => {
      if (containerRef.current) {
        const safeIndex = Math.min(Math.max(scrollState.speed, 0), SPEED_LEVELS.length - 1);
        const pxToAdd = SPEED_LEVELS[safeIndex];
        
        scrollAccumulator.current += pxToAdd;

        if (scrollAccumulator.current >= 1) {
          const pixelsToMove = Math.floor(scrollAccumulator.current);
          containerRef.current.scrollTop += pixelsToMove;
          scrollAccumulator.current -= pixelsToMove;
        }
      }
    }, 16);

    scrollInterval.current = interval;

    return () => {
      if (scrollInterval.current) window.clearInterval(scrollInterval.current);
    };
  }, [scrollState.isPlaying, scrollState.speed]);

  // --- Handlers ---

  const handleSongSelect = async (songId: string) => {
    if (!bandId) return;
    if (containerRef.current) containerRef.current.scrollTop = 0;
    setActiveSongId(songId);
    await setCurrentSong(bandId, songId);
  };

  const handleQuickAddSong = async (song: Song) => {
    if (!bandId || !playlistId || !playlist) return;
    try {
      const newOrder = playlist.songs.length;
      const newSongEntry = {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        order: newOrder
      };
      const updatedSongs = [...playlist.songs, newSongEntry];
      await updatePlaylistOrder(bandId, playlistId, updatedSongs);
      setPlaylist({ ...playlist, songs: updatedSongs });
      showToast(`${song.title} adicionada!`, 'success');
      setIsAddSongModalOpen(false);
      handleSongSelect(song.id);
    } catch (e) {
      console.error(e);
      showToast('Erro ao adicionar música.', 'error');
    }
  };

  const handleSectionClick = async (index: number) => {
    if (!bandId) return;
    setActiveSectionIndex(index);
    await setCurrentSection(bandId, index);
  };

  const handleTranspose = async (delta: number) => {
    if (!bandId) return;
    const newAmount = transposeAmount + delta;
    setTransposeAmount(newAmount);
    await setTranspose(bandId, newAmount);
  };

  const handleSendCue = async (msg: string, type: 'preset' | 'custom' = 'preset') => {
    if (!bandId) return;
    await sendCue(bandId, msg, type);
    if (type === 'custom') setCustomCue('');
    setIsCuesOpen(false);
  };

  const handleTogglePlay = async () => {
    if (!bandId) return;
    const newState = !scrollState.isPlaying;
    setScrollState(prev => ({ ...prev, isPlaying: newState }));
    await toggleScrollPlay(bandId, newState);
  };

  const cycleSpeed = async () => {
    if (!bandId) return;
    let newSpeed = scrollState.speed + 1;
    if (newSpeed >= SPEED_LEVELS.length) newSpeed = 0;
    setScrollState(prev => ({ ...prev, speed: newSpeed }));
    await setScrollSpeed(bandId, newSpeed);
  };

  const handleEndSession = async () => {
    if (!bandId) return;
    try {
      await endSession(bandId);
      navigate(`/band/${bandId}/dashboard`);
    } catch (error) {
      console.error("Failed to end session:", error);
      showToast("Erro ao encerrar sessão.", "error");
    }
  };

  const safeSpeedIndex = Math.min(Math.max(scrollState.speed, 0), SPEED_LEVELS.length - 1);

  // --- RENDER VIA PORTAL TO ESCAPE LAYOUT CONSTRAINTS ---
  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-midnight-900 text-gray-400 flex items-center justify-center font-sans text-sm tracking-widest animate-pulse">
          SINCRONIZANDO SESSÃO...
        </div>
      );
    }

    if (status === 'blocked') {
      return (
        <div className="fixed inset-0 z-[100] p-10 bg-white text-gray-900 flex items-center justify-center">
          <div>
            <h2 className="text-xl font-bold">Recurso Bloqueado</h2>
            <p>Assinatura necessária.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-600 underline">Voltar</button>
          </div>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="fixed inset-0 z-[100] p-10 bg-white text-gray-900 flex items-center justify-center">
          <div>
            <h2 className="text-xl font-bold text-red-600">Erro de Conexão</h2>
            <p>Não foi possível carregar a sessão.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-600 underline">Voltar</button>
          </div>
        </div>
      );
    }

    return (
      <div className={`fixed inset-0 font-sans flex flex-col overflow-hidden z-[100] ${localSettings.highContrast ? 'bg-white' : 'bg-gray-50 dark:bg-midnight-900'}`}>
        
        {/* --- HEADER (Flex Item) --- */}
        <header className="shrink-0 h-24 bg-white/95 dark:bg-midnight-800/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 lg:px-6 flex items-center justify-between z-[110] shadow-sm relative">
          <div className="flex flex-col items-start gap-1 w-1/4">
             <div className="flex items-center gap-2">
               <ConnectionStatus status="connected" />
             </div>
          </div>
          <div className="flex flex-col items-center justify-center w-2/4 text-center">
             {currentSongData ? (
               <>
                 <h1 className="font-black text-gray-900 dark:text-white text-xl md:text-3xl uppercase tracking-tight leading-none mb-1 truncate w-full">
                   {currentSongData.title}
                 </h1>
                 <div className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                   <span className="truncate max-w-[150px]">{currentSongData.artist}</span>
                   <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                   <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs">
                     {currentSongData.key} {transposeAmount !== 0 && `(${transposeAmount > 0 ? '+' : ''}${transposeAmount})`}
                   </span>
                 </div>
               </>
             ) : (
               <h1 className="font-black text-gray-400 dark:text-gray-600 text-xl uppercase tracking-widest">Aguardando Música</h1>
             )}
          </div>
          <div className="flex items-center justify-end gap-2 w-1/4">
            <button 
              onClick={() => setIsEndModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white border border-red-700 px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95 hover:shadow-red-500/20"
            >
              Sair
            </button>
          </div>
        </header>

        {/* --- MAIN CONTENT AREA (Flex Grow) --- */}
        <div className="flex-1 relative flex overflow-hidden z-10">
          
          {/* LEFT: MAIN SCROLLABLE CANVAS */}
          <div className="flex-1 relative bg-gray-50/50 dark:bg-black/20 flex flex-col min-w-0">
            
            <div 
              className="flex-1 overflow-y-auto px-4 lg:px-12 pt-8 pb-48 custom-scrollbar" 
              ref={containerRef}
              style={{ scrollBehavior: scrollState.isPlaying ? 'auto' : 'smooth' }}
            >
               {activeSongId && !currentSongData && (
                  <div className="max-w-7xl mx-auto space-y-6 animate-pulse opacity-50">
                     <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-2xl"></div>
                     <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-2xl"></div>
                  </div>
               )}

               {currentSongData ? (
                  <div className={`max-w-7xl mx-auto transition-all duration-300 ${localSettings.columns === 2 ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6' : 'space-y-4 md:space-y-6'}`}>
                     {/* SAFE GUARD: Check for sections existence and length */}
                     {currentSongData.sections && currentSongData.sections.length > 0 ? (
                       currentSongData.sections.map((section, idx) => {
                          const isActive = activeSectionIndex === idx;
                          return (
                            <div 
                              key={section.id || idx}
                              ref={(el) => { sectionRefs.current[idx] = el; }}
                              onClick={() => handleSectionClick(idx)}
                              className={`
                                cursor-pointer rounded-2xl p-6 border-2 shadow-sm relative min-w-0 transition-all
                                ${isActive 
                                  ? 'border-indigo-600 ring-4 ring-indigo-500/10 bg-white dark:bg-white/5' 
                                  : 'border-transparent bg-white dark:bg-white/5 opacity-70 hover:opacity-100'
                                }
                              `}
                            >
                               <div className="flex items-center justify-between mb-4">
                                  <span className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-md ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                                    {section.name}
                                  </span>
                               </div>
                               
                               <div className="pointer-events-none w-full overflow-hidden">
                                 <ChordRenderer 
                                   content={section.content || ''} 
                                   transpose={transposeAmount} 
                                   fontSize={localSettings.fontSize} 
                                   mode="controller" 
                                   customTheme={{ 
                                     chordColor: localSettings.chordColor,
                                     textColor: localSettings.highContrast ? 'text-black font-extrabold' : 'text-gray-900 dark:text-gray-200'
                                   }}
                                 />
                               </div>
                            </div>
                          );
                       })
                     ) : (
                       <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">
                          Esta música não tem conteúdo visível ou seções definidas.
                       </div>
                     )}
                  </div>
               ) : (
                 !activeSongId && (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
                      <p className="text-sm font-bold uppercase tracking-widest">Selecione uma música ao lado</p>
                   </div>
                 )
               )}
            </div>

            {/* FLOATING CONTROL BAR */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none">
               <div className="pointer-events-auto bg-white dark:bg-midnight-800 border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-3 flex items-center gap-3 w-auto inline-flex min-w-fit ring-1 ring-black/5 dark:ring-white/10">
                  <div className="relative">
                    <button 
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isSettingsOpen ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                    </button>
                    {isSettingsOpen && (
                      <div className="absolute bottom-full left-0 mb-3 w-72 bg-white dark:bg-midnight-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                         <div className="mb-4">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tamanho</h3>
                           <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                              {['md', 'lg', 'xl', '2xl'].map(s => (
                                <button key={s} onClick={() => setLocalSettings(p => ({...p, fontSize: s}))} className={`flex-1 py-2 text-xs font-bold rounded ${localSettings.fontSize === s ? 'bg-white dark:bg-white/10 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>{s.toUpperCase()}</button>
                              ))}
                           </div>
                         </div>
                         <div>
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cor Acorde</h3>
                           <div className="flex gap-2 justify-between">
                              {CHORD_COLORS.map(color => (
                                <button
                                  key={color.id}
                                  onClick={() => setLocalSettings(p => ({...p, chordColor: color.class}))}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${localSettings.chordColor === color.class ? 'scale-110 border-gray-400 dark:border-white/50 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                  style={{ backgroundColor: 'currentColor' }}
                                >
                                  <span className={color.class}></span>
                                  <span className={`block w-full h-full rounded-full ${color.class.replace('text-', 'bg-')}`}></span>
                                </button>
                              ))}
                           </div>
                         </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setLocalSettings(p => ({ ...p, columns: p.columns === 1 ? 2 : 1 }))}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${localSettings.columns === 2 ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}
                  >
                     {localSettings.columns === 1 ? (
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                     ) : (
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                     )}
                  </button>

                  <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>

                  <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl p-1 shrink-0 h-14">
                     <button onClick={() => handleTranspose(-1)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 shadow-sm text-gray-600 dark:text-gray-200 font-bold active:scale-95 transition-transform">-</button>
                     <div className="w-10 text-center font-black text-indigo-600 dark:text-indigo-400 text-sm">{transposeAmount > 0 ? `+${transposeAmount}` : transposeAmount}</div>
                     <button onClick={() => handleTranspose(1)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 shadow-sm text-gray-600 dark:text-gray-200 font-bold active:scale-95 transition-transform">+</button>
                  </div>

                  <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>

                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-2xl p-1 h-14">
                     <button 
                       onClick={handleTogglePlay}
                       className={`h-12 w-32 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95 gap-2 px-4 ${scrollState.isPlaying ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}
                     >
                        {scrollState.isPlaying ? (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" /></svg>
                            <span className="text-sm font-bold">Parar</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            <span className="text-sm font-bold">Rolar</span>
                          </>
                        )}
                     </button>
                     
                     <button 
                       onClick={cycleSpeed} 
                       className="h-12 px-4 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-gray-600 dark:text-gray-200 font-bold text-sm shadow-sm active:scale-95 border border-gray-200 dark:border-white/10 min-w-[50px]"
                     >
                       {SPEED_LABELS[safeSpeedIndex]}
                     </button>
                  </div>

                  <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>

                  <div className="relative">
                    <button 
                       onClick={() => setIsCuesOpen(!isCuesOpen)}
                       className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${isCuesOpen ? 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-300 dark:border-yellow-500/50 text-yellow-700 dark:text-yellow-300' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800'}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    </button>
                    {isCuesOpen && (
                      <div className="absolute bottom-full right-0 mb-3 w-[320px] bg-white dark:bg-midnight-800 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Comandos</h3>
                         <div className="grid grid-cols-2 gap-2 mb-3">
                            {PRESET_CUES.map(cue => (
                              <button key={cue} onClick={() => handleSendCue(cue)} className="bg-gray-50 dark:bg-white/5 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 hover:text-yellow-800 dark:hover:text-yellow-200 border border-gray-200 dark:border-white/10 rounded-lg py-3 text-[10px] font-bold uppercase transition-colors text-gray-700 dark:text-gray-300">
                                {cue}
                              </button>
                            ))}
                         </div>
                         <input 
                           type="text" 
                           className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-white"
                           placeholder="Mensagem..."
                           value={customCue}
                           onChange={e => setCustomCue(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSendCue(customCue, 'custom')}
                         />
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT: SIDEBAR (Flex Item) */}
          <div className="w-80 bg-white dark:bg-midnight-800 border-l border-gray-200 dark:border-white/10 flex-col z-40 hidden lg:flex shrink-0">
             <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                <div>
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Playlist</h2>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{playlist?.title || 'Avulso'}</p>
                </div>
                <button 
                  onClick={() => setIsAddSongModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {playlist && playlist.songs.length > 0 ? (
                  playlist.songs.map((s, idx) => (
                    <button
                      key={`${s.songId}-${idx}`}
                      onClick={() => handleSongSelect(s.songId)}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl transition-all relative overflow-hidden flex items-center gap-3 border
                        ${activeSongId === s.songId 
                          ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 shadow-sm' 
                          : 'bg-white dark:bg-white/5 border-transparent hover:bg-gray-50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-white/10'
                        }
                      `}
                    >
                       <span className={`text-[10px] font-bold w-6 h-6 rounded-lg flex items-center justify-center ${activeSongId === s.songId ? 'bg-indigo-200 dark:bg-indigo-500/40 text-indigo-700 dark:text-indigo-100' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>{idx + 1}</span>
                       <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold">{s.title}</div>
                          <div className="truncate text-xs text-gray-400">{s.artist} • {s.key}</div>
                       </div>
                       {activeSongId === s.songId && (
                         <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                       )}
                    </button>
                  ))
                ) : (
                   <div className="text-center py-10 text-gray-400 text-xs px-4">
                      Nenhuma música. Adicione acima.
                   </div>
                )}
             </div>
          </div>

        </div>

        <Modal 
          isOpen={isAddSongModalOpen}
          title="Adicionar Música"
          message=""
          onConfirm={() => {}}
          onCancel={() => setIsAddSongModalOpen(false)}
          variant="primary"
          cancelLabel="Fechar"
          confirmLabel=""
        >
           <div className="max-h-[300px] overflow-y-auto -mx-4 px-4 custom-scrollbar">
              {allBandSongs.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">Sem músicas no repertório.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-white/5">
                  {allBandSongs.map(song => (
                    <li key={song.id}>
                      <button 
                        onClick={() => handleQuickAddSong(song)}
                        className="w-full text-left py-3 px-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded flex justify-between items-center group"
                      >
                        <div>
                          <div className="font-bold text-gray-800 dark:text-white text-sm">{song.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{song.artist}</div>
                        </div>
                        <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
           </div>
        </Modal>

        <Modal
          isOpen={isEndModalOpen}
          title="Encerrar Sessão"
          message="Isso desconectará todos os músicos. Deseja continuar?"
          variant="danger"
          confirmLabel="Encerrar Agora"
          onConfirm={handleEndSession}
          onCancel={() => setIsEndModalOpen(false)}
        />
      </div>
    );
  };

  // Render the entire content into the document body to bypass layout stacking contexts
  return createPortal(renderContent(), document.body);
};

export default RegencyController;
