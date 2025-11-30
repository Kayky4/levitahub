
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSong, updateSong, canEditMusic } from '../../services/songs';
import { getBandMembers } from '../../services/bands';
import { SongSection } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import KeySelector from '../../components/songs/KeySelector';
import ChordRenderer from '../../components/regency/ChordRenderer';
import Skeleton from '../../components/ui/Skeleton';

const QUICK_TAGS = ['[Intro]', '[Verso]', '[Refrão]', '[Ponte]', '[Instrumental]', '[Final]'];

const SongEdit: React.FC = () => {
  const { bandId, songId } = useParams<{ bandId: string; songId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [content, setContent] = useState('');

  // UI State
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Data
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

        setTitle(fetchedSong.title);
        setArtist(fetchedSong.artist);
        setMusicalKey(fetchedSong.key);

        // Convert Sections to String for the editor
        // This ensures existing songs are editable in the new format
        if (fetchedSong.sections && fetchedSong.sections.length > 0) {
          const textContent = fetchedSong.sections.map(s => {
             // Treat as a standard format: Header then Content
             return `[${s.name}]\n${s.content}`;
          }).join('\n\n');
          setContent(textContent);
        } else {
           // Fallback to raw content or empty
           setContent(fetchedSong.content || '');
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

  const insertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Ensure newline before and after if needed, roughly
    const textToInsert = `\n\n${tag}\n`;
    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!bandId || !songId) return;
    setSaving(true);

    try {
      // Parse content back into Sections for Regency compatibility
      let sections: SongSection[] = [];
      
      // Split by header tags like [Intro]
      // The regex `/(?=\[.*?\])/g` splits *before* the match, keeping the match in the next part.
      // E.g. "Line 1\n[Intro]..." -> ["Line 1\n", "[Intro]..."]
      const parts = content.split(/(?=\[.*?\])/g);
      
      sections = parts.map((part, index) => {
        const trimmed = part.trim();
        if (!trimmed) return null;

        // Extract Header
        const headerMatch = trimmed.match(/^\[(.*?)\]([\s\S]*)/);
        
        let name = `Seção ${index + 1}`;
        let sectionContent = trimmed;

        if (headerMatch) {
          name = headerMatch[1];
          sectionContent = headerMatch[2].trim();
        }

        // Skip purely empty sections if mostly whitespace
        if (!sectionContent && !headerMatch) return null;

        return {
          id: crypto.randomUUID(),
          index: index,
          name: name,
          content: sectionContent,
          cues: '' 
        };
      }).filter(Boolean) as SongSection[];

      // Fallback: If user deleted all headers, treat as one big section
      if (sections.length === 0 && content.trim()) {
        sections.push({
          id: crypto.randomUUID(),
          index: 0,
          name: 'Geral',
          content: content.trim(),
          cues: ''
        });
      }

      await updateSong(bandId, songId, {
        title,
        artist,
        key: musicalKey,
        sections,
        content: content // Save raw string too
      });

      showToast('Alterações salvas!', 'success');
      setIsPreviewMode(true); // Switch to preview to show result
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-midnight-900 flex flex-col p-6 space-y-4">
        <Skeleton height="4rem" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-midnight-900 text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      {/* 1. Header (Metadata & Actions) */}
      <header className="h-16 bg-white/90 dark:bg-midnight-800/90 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 z-20 shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          
          <div className="flex flex-col min-w-0 flex-1 mr-4">
             <input 
               className="bg-transparent border-none p-0 text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 truncate w-full"
               value={title}
               onChange={e => setTitle(e.target.value)}
               placeholder="Título da Música"
             />
             <input 
               className="bg-transparent border-none p-0 text-xs text-gray-500 dark:text-gray-400 focus:ring-0 truncate w-full font-medium"
               value={artist}
               onChange={e => setArtist(e.target.value)}
               placeholder="Artista"
             />
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowKeySelector(true)}
             className={`
               flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all touch-manipulation
               ${musicalKey 
                 ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30' 
                 : 'bg-gray-50 border-dashed border-gray-300 dark:bg-white/5 dark:border-white/10'
               }
             `}
           >
             <span className="text-[9px] uppercase font-bold text-gray-400">Tom</span>
             <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none">
               {musicalKey || '?'}
             </span>
           </button>

           <Button 
             onClick={handleSave} 
             isLoading={saving}
             size="md"
             className="shadow-md"
           >
             Salvar
           </Button>
        </div>
      </header>

      {/* 2. Editor / Preview Area */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-midnight-900">
         
         {/* Toolbar (Only in Edit Mode) */}
         {!isPreviewMode && (
            <div className="h-12 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 flex items-center px-4 gap-2 overflow-x-auto custom-scrollbar shrink-0">
               {QUICK_TAGS.map(tag => (
                 <button
                   key={tag}
                   onClick={() => insertTag(tag)}
                   className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors whitespace-nowrap shadow-sm"
                 >
                   {tag}
                 </button>
               ))}
            </div>
         )}

         {/* Content */}
         <div className={`absolute inset-0 ${!isPreviewMode ? 'top-12' : 'top-0'} bottom-0 overflow-hidden`}>
            {isPreviewMode ? (
               <div className="h-full w-full p-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-black/20">
                  <div className="max-w-2xl mx-auto">
                    <ChordRenderer content={content} fontSize="lg" mode="controller" />
                  </div>
               </div>
            ) : (
               <textarea
                 ref={textareaRef}
                 value={content}
                 onChange={e => setContent(e.target.value)}
                 className="w-full h-full resize-none p-6 bg-transparent border-none focus:ring-0 font-mono text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200"
                 placeholder="Cole a cifra aqui ou comece a digitar..."
                 spellCheck={false}
               />
            )}
         </div>

         {/* Floating Mode Toggle */}
         <div className="absolute bottom-6 right-6 z-30">
            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title={isPreviewMode ? "Voltar para Edição" : "Ver Preview"}
            >
              {isPreviewMode ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
         </div>

      </div>

      <KeySelector 
        isOpen={showKeySelector} 
        onClose={() => setShowKeySelector(false)} 
        onSelect={(k) => { setMusicalKey(k); setShowKeySelector(false); }} 
        currentKey={musicalKey}
      />

    </div>
  );
};

export default SongEdit;
