import React, { useEffect, useState, useRef, useCallback } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { getSong, updateSong, canEditMusic } from '../../services/songs';
import { getBandMembers } from '../../services/bands';
import { Song, SongSection } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import KeyBadge from '../../components/songs/KeyBadge';
import KeySelector from '../../components/songs/KeySelector';
import ChordRenderer from '../../components/regency/ChordRenderer';
import Skeleton from '../../components/ui/Skeleton';

// --- CONSTANTS ---
const QUICK_TAGS = ['[Intro]', '[Verso]', '[Refrão]', '[Ponte]', '[Instrumental]', '[Final]'];
const COMMON_CHORDS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'm', '#', '7', 'sus'];

const SongEdit: React.FC = () => {
  const { bandId, songId } = useParams<{ bandId: string; songId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [songData, setSongData] = useState<Partial<Song>>({});
  
  // Editor State
  const [sections, setSections] = useState<SongSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // UI State
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [showCues, setShowCues] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // --- LOAD DATA ---
  useEffect(() => {
    if (!bandId || !songId || !user) return;

    const load = async () => {
      try {
        const [fetchedSong, members] = await Promise.all([
          getSong(bandId, songId),
          getBandMembers(bandId)
        ]);

        if (!fetchedSong) {
          navigate(`/band/${bandId}/songs`);
          return;
        }

        const me = members.find(m => m.userId === user.uid);
        if (!me || !canEditMusic(me.role)) {
          showToast('Permissão negada.', 'error');
          navigate(`/band/${bandId}/songs/${fetchedSong.id}`);
          return;
        }

        setSongData({
          title: fetchedSong.title,
          artist: fetchedSong.artist,
          key: fetchedSong.key
        });
        
        // Ensure valid sections array
        const loadedSections = fetchedSong.sections || [];
        setSections(loadedSections);
        
        // Select first section by default on Desktop
        if (window.innerWidth >= 1024 && loadedSections.length > 0) {
          setActiveSectionId(loadedSections[0].id);
        }

      } catch (error) {
        console.error(error);
        showToast('Erro ao carregar música.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bandId, songId, user]);

  // --- ACTIONS ---

  const handleSave = async () => {
    if (!bandId || !songId) return;
    setSaving(true);
    try {
      // Re-index sections to ensure order integrity
      const indexedSections = sections.map((s, idx) => ({ ...s, index: idx }));
      
      await updateSong(bandId, songId, {
        title: songData.title,
        artist: songData.artist,
        key: songData.key,
        sections: indexedSections
      });
      
      showToast('Alterações salvas com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    const newId = crypto.randomUUID();
    const newSection: SongSection = {
      id: newId,
      index: sections.length,
      name: `Nova Seção ${sections.length + 1}`,
      content: '',
      cues: ''
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newId);
    // Auto focus on name input is handled by UI logic
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
       showToast("A música deve ter pelo menos uma seção.", "info");
       return;
    }
    if (confirm("Remover esta seção?")) {
      const newSections = sections.filter(s => s.id !== id);
      setSections(newSections);
      if (activeSectionId === id) {
        setActiveSectionId(null);
      }
    }
  };

  const updateActiveSection = (field: keyof SongSection, value: string) => {
    if (!activeSectionId) return;
    setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, [field]: value } : s));
  };

  // Reorder Logic
  const handleReorder = (newOrder: SongSection[]) => {
    setSections(newOrder);
  };

  // Toolbar Insert
  const insertText = (text: string) => {
    if (!editorRef.current || !activeSectionId) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = sections.find(s => s.id === activeSectionId)?.content || '';
    
    // Insert text
    const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
    updateActiveSection('content', newContent);
    
    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-midnight-900 flex flex-col p-6 space-y-4">
        <Skeleton height="4rem" />
        <div className="flex-1 flex gap-4">
          <Skeleton className="w-1/3 h-full" />
          <Skeleton className="w-2/3 h-full" />
        </div>
      </div>
    );
  }

  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-midnight-900 text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* 1. MASTER HEADER (Fixed) */}
      <header className="h-16 bg-white dark:bg-midnight-800 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors min-w-[48px] min-h-[48px]"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          
          <div className="flex flex-col min-w-0">
             {/* Inline Metadata Editor */}
             <input 
               className="bg-transparent border-none p-0 text-base md:text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 truncate h-[28px]"
               value={songData.title || ''}
               onChange={e => setSongData(prev => ({ ...prev, title: e.target.value }))}
               placeholder="Título da Música"
             />
             <input 
               className="bg-transparent border-none p-0 text-xs text-gray-500 dark:text-gray-400 focus:ring-0 truncate h-[20px]"
               value={songData.artist || ''}
               onChange={e => setSongData(prev => ({ ...prev, artist: e.target.value }))}
               placeholder="Artista"
             />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
           {/* Key Selector */}
           <button 
             onClick={() => setShowKeySelector(true)}
             className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors min-h-[48px]"
           >
             <span className="text-[10px] uppercase font-bold text-gray-500">Tom</span>
             <KeyBadge musicalKey={songData.key || '?'} size="sm" className="shadow-none border-none bg-transparent" />
           </button>

           <div className="w-px h-6 bg-gray-200 dark:bg-white/10 hidden sm:block"></div>

           <Button 
             onClick={handleSave} 
             isLoading={saving}
             size="sm"
             className="shadow-md min-h-[48px]"
             leftIcon={<span className="text-lg">💾</span>}
           >
             <span className="hidden sm:inline">Salvar</span>
           </Button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (Master-Detail Grid) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR (List) - Hidden on mobile if section active */}
        <div className={`
          flex flex-col bg-white dark:bg-midnight-900 border-r border-gray-200 dark:border-white/5 transition-all duration-300
          ${activeSectionId ? 'hidden lg:flex w-full lg:w-80' : 'w-full lg:w-80'}
        `}>
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02] min-h-[56px]">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estrutura</span>
             <span className="text-xs text-gray-400">{sections.length} seções</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="space-y-3">
              {sections.map(section => (
                <Reorder.Item key={section.id} value={section}>
                  <motion.div
                    layoutId={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`
                      group relative p-4 rounded-xl border-2 cursor-pointer transition-all select-none min-h-[72px] flex flex-col justify-center
                      ${activeSectionId === section.id 
                        ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-500/20 dark:border-indigo-500/50 shadow-md z-10' 
                        : 'bg-white dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                       <span className={`cursor-grab active:cursor-grabbing p-2 -ml-2 rounded hover:bg-black/5 dark:hover:bg-white/10 ${activeSectionId === section.id ? 'text-indigo-500' : 'text-gray-300'}`}>
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                       </span>
                       <div className="flex-1 min-w-0">
                          <p className={`text-base font-bold truncate ${activeSectionId === section.id ? 'text-indigo-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {section.name}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate font-mono">
                            {section.content.substring(0, 30) || '(Vazio)'}
                          </p>
                       </div>
                       <div className="text-[10px] font-bold text-gray-300">
                          #{section.index + 1}
                       </div>
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            
            <button 
              onClick={handleAddSection}
              className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-sm font-bold flex items-center justify-center gap-2 min-h-[64px]"
            >
              <span>+</span> Adicionar Seção
            </button>
          </div>
        </div>

        {/* EDITOR PANE (Main) - Fullscreen on mobile when active */}
        <div className={`
          flex-1 flex flex-col bg-gray-50 dark:bg-black/20 transition-all duration-300 relative
          ${!activeSectionId ? 'hidden lg:flex' : 'flex'}
        `}>
          {activeSection ? (
            <>
              {/* Editor Header */}
              <div className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 bg-white dark:bg-midnight-800">
                 <div className="flex items-center gap-3 w-full">
                    {/* Mobile Back Button */}
                    <button 
                      onClick={() => setActiveSectionId(null)}
                      className="lg:hidden p-3 -ml-3 text-gray-500 min-w-[48px] min-h-[48px]"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    
                    <input 
                      value={activeSection.name}
                      onChange={(e) => updateActiveSection('name', e.target.value)}
                      className="flex-1 bg-transparent border-none text-lg font-bold text-gray-900 dark:text-white focus:ring-0 placeholder-gray-400 h-[40px]"
                      placeholder="Nome da Seção (ex: Refrão)"
                    />
                 </div>

                 <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setShowCues(!showCues)}
                      className={`p-3 rounded-lg transition-colors min-w-[48px] min-h-[48px] ${showCues ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                      title="Notas de Regência"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    </button>
                    <button 
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className={`p-3 rounded-lg transition-colors min-w-[48px] min-h-[48px] ${isPreviewMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                      title="Pré-visualizar"
                    >
                      {isPreviewMode ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                    <button 
                      onClick={() => handleDeleteSection(activeSection.id)}
                      className="p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors min-w-[48px] min-h-[48px]"
                    >
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
              </div>

              {/* Editor Toolbar (Tags) */}
              {!isPreviewMode && (
                <div className="h-14 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 flex items-center px-4 gap-2 overflow-x-auto custom-scrollbar shrink-0">
                   {QUICK_TAGS.map(tag => (
                     <button
                       key={tag}
                       onClick={() => insertText(tag + '\n')}
                       className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-200 transition-colors whitespace-nowrap min-h-[32px]"
                     >
                       {tag.replace(/[\[\]]/g, '')}
                     </button>
                   ))}
                   <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-2"></div>
                   {COMMON_CHORDS.map(chord => (
                     <button
                       key={chord}
                       onClick={() => insertText(chord)}
                       className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-mono font-bold text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors min-h-[32px]"
                     >
                       {chord}
                     </button>
                   ))}
                </div>
              )}

              {/* Regência Cues (Optional Panel) */}
              <AnimatePresence>
                {showCues && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-yellow-50 dark:bg-yellow-500/10 border-b border-yellow-200 dark:border-yellow-500/20 px-4 py-3 overflow-hidden"
                  >
                     <label className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-500 tracking-wide mb-1 block">
                       Nota de Palco (Aparece no HUD do Músico)
                     </label>
                     <input
                       type="text"
                       value={activeSection.cues || ''}
                       onChange={(e) => updateActiveSection('cues', e.target.value)}
                       placeholder="Ex: Entrar suave, Só Bateria, Aumentar dinâmica..."
                       className="w-full bg-white dark:bg-black/20 border border-yellow-300 dark:border-yellow-500/30 rounded-lg px-3 py-2 text-sm text-yellow-900 dark:text-yellow-100 placeholder-yellow-400/50 focus:ring-1 focus:ring-yellow-500 outline-none"
                     />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content Area */}
              <div className="flex-1 relative overflow-hidden bg-white dark:bg-midnight-800">
                 {isPreviewMode ? (
                   <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
                      <ChordRenderer content={activeSection.content} fontSize="lg" />
                   </div>
                 ) : (
                   <textarea
                     ref={editorRef}
                     value={activeSection.content}
                     onChange={(e) => updateActiveSection('content', e.target.value)}
                     className="absolute inset-0 w-full h-full resize-none p-6 bg-transparent border-none focus:ring-0 font-mono text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200"
                     placeholder="Digite a cifra aqui..."
                     spellCheck={false}
                   />
                 )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-midnight-800">
               <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
               <p className="text-sm font-medium">Selecione uma seção para editar</p>
            </div>
          )}
        </div>
      </div>

      {/* Key Selector Modal */}
      <KeySelector 
        isOpen={showKeySelector} 
        onClose={() => setShowKeySelector(false)} 
        onSelect={(k) => { setSongData(p => ({...p, key: k})); setShowKeySelector(false); }} 
        currentKey={songData.key || ''}
      />

    </div>
  );
};

export default SongEdit;