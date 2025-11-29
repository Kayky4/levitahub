import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { createSong } from '../../services/songs';
import { SongSection } from '../../services/types';
import Button from '../../components/ui/Button';
import ChordRenderer from '../../components/regency/ChordRenderer';
import { useToast } from '../../context/ToastContext';
import KeySelector from '../../components/songs/KeySelector'; 
import { motion, AnimatePresence } from 'framer-motion';

const SECTION_TAGS = ['Intro', 'Verso', 'Refrão', 'Ponte', 'Instrumental', 'Final'];

const SongCreate: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [rawContent, setRawContent] = useState('');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [showKeySelector, setShowKeySelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smart Paste Logic
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    
    // 1. Detect Key (Patterns like "Tom: G", "Key: G#m")
    const keyMatch = text.match(/(?:Tom|Key):\s*([A-G][#b]?(?:m|min|maj)?)/i);
    if (keyMatch && !key) {
      setKey(keyMatch[1]);
      showToast(`Tom detectado: ${keyMatch[1]}`, 'success');
    }

    // 2. Detect Artist (Patterns like "Cantor: X", first line analysis)
    // Simple heuristic: If first line is short and looks like a name, and title is empty
    const lines = text.split('\n');
    if (lines.length > 0 && !artist) {
        const potentialArtistMatch = text.match(/(?:Artista|Cantor):\s*(.*)/i);
        if (potentialArtistMatch) {
            setArtist(potentialArtistMatch[1].trim());
        }
    }
  };

  const insertTag = (tag: string) => {
    const tagText = `\n\n[${tag}]\n`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = rawContent.substring(0, start) + tagText + rawContent.substring(end);
      setRawContent(newText);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagText.length, start + tagText.length);
      }, 0);
    } else {
      setRawContent(prev => prev + tagText);
    }
  };

  const handleSubmit = async () => {
    if (!bandId) return;
    if (!title.trim()) { showToast('O título é obrigatório.', 'error'); return; }
    if (!key) { showToast('Defina o tom da música.', 'error'); setShowKeySelector(true); return; }

    setIsSubmitting(true);

    try {
      // Smart Segmentation Logic
      const hasHeaders = /\[.*?\]/.test(rawContent);
      let sections: SongSection[] = [];

      if (hasHeaders) {
        // Split by lines starting with [
        const rawSections = rawContent.split(/(?=\[.*?\])/g);
        sections = rawSections.map((block, idx) => {
           const lines = block.trim().split('\n');
           const headerMatch = lines[0].match(/\[(.*?)\]/);
           const name = headerMatch ? headerMatch[1] : (idx === 0 ? 'Início' : `Seção ${idx}`);
           const content = headerMatch ? lines.slice(1).join('\n').trim() : block.trim();
           
           return {
             id: crypto.randomUUID(),
             index: idx,
             name: name,
             content: content,
             cues: ''
           };
        }).filter(s => s.content.length > 0); // Remove empty blocks
      } else {
        // Fallback: Double newline split
        const blocks = rawContent.split(/\n\n+/);
        sections = blocks.map((block, idx) => ({
          id: crypto.randomUUID(),
          index: idx,
          name: idx === 0 ? 'Início' : `Seção ${idx + 1}`,
          content: block.trim(),
          cues: ''
        })).filter(s => s.content.length > 0);
      }

      await createSong(bandId, {
        title,
        artist,
        key,
        content: rawContent,
        sections
      });

      showToast('Música criada com sucesso!', 'success');
      navigate(`/band/${bandId}/songs`);
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar música.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex flex-col h-screen overflow-hidden transition-colors duration-300">
      
      {/* 1. Ultra Premium Header */}
      <header className="bg-white/80 dark:bg-midnight-800/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 z-20 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
             <Button variant="ghost" onClick={() => navigate(-1)} className="shrink-0 p-3 min-w-[48px] min-h-[48px]">
               &larr;
             </Button>
             
             <div className="flex-1 flex flex-col justify-center">
               <input 
                 type="text" 
                 placeholder="Título da Música"
                 className="bg-transparent border-none p-0 text-lg md:text-xl font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 w-full h-[32px]"
                 value={title}
                 onChange={e => setTitle(e.target.value)}
               />
               <input 
                 type="text" 
                 placeholder="Artista / Banda"
                 className="bg-transparent border-none p-0 text-sm font-medium text-gray-500 dark:text-gray-400 placeholder-gray-500/50 focus:ring-0 w-full h-[24px]"
                 value={artist}
                 onChange={e => setArtist(e.target.value)}
               />
             </div>
          </div>

          <div className="flex items-center gap-2">
             {/* Key Selector Trigger */}
             <button
               onClick={() => setShowKeySelector(true)}
               className={`
                 flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all touch-manipulation min-h-[56px]
                 ${key 
                   ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-500/20 dark:border-indigo-400' 
                   : 'bg-gray-50 border-dashed border-gray-300 dark:bg-white/5 dark:border-white/10 hover:border-gray-400'
                 }
               `}
             >
               <span className="text-[10px] uppercase font-bold text-gray-400">Tom</span>
               <span className={`text-lg font-black leading-none ${key ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-300'}`}>
                 {key || '?'}
               </span>
             </button>

             <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>
             
             <Button 
               variant="primary" 
               onClick={handleSubmit} 
               isLoading={isSubmitting}
               className="shadow-lg shadow-indigo-500/20 min-w-[80px]"
             >
               Salvar
             </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Editor (Input) */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-midnight-900 transition-all duration-300 ${showPreviewMobile ? 'hidden lg:flex' : 'flex'}`}>
           
           {/* Editor Toolbar - Increased sizes and spacing */}
           <div className="h-16 border-b border-gray-100 dark:border-white/5 flex items-center px-4 gap-3 overflow-x-auto custom-scrollbar shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
              <span className="text-xs font-bold text-gray-400 uppercase mr-1 shrink-0">Inserir:</span>
              {SECTION_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => insertTag(tag)}
                  className="px-4 py-2 min-h-[44px] rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 transition-colors whitespace-nowrap shadow-sm touch-manipulation active:bg-gray-100"
                >
                  {tag}
                </button>
              ))}
           </div>

           {/* TextArea */}
           <textarea
             ref={textareaRef}
             value={rawContent}
             onChange={e => setRawContent(e.target.value)}
             onPaste={handlePaste}
             placeholder="Cole sua cifra aqui...&#10;&#10;Exemplo:&#10;[Intro]&#10;G  D  Em  C&#10;&#10;[Verso 1]&#10;G       D&#10;Esta é a primeira linha"
             className="flex-1 w-full resize-none p-6 bg-transparent border-none focus:ring-0 font-mono text-base md:text-lg leading-relaxed text-gray-800 dark:text-gray-200"
             spellCheck={false}
           />
        </div>

        {/* Right: Live Preview */}
        <div className={`flex-1 bg-gray-50 dark:bg-black/20 border-l border-gray-200 dark:border-white/5 flex-col ${showPreviewMobile ? 'flex' : 'hidden lg:flex'}`}>
           <div className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 bg-gray-100/50 dark:bg-white/[0.02] shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 Pré-visualização
              </span>
              <span className="text-xs text-gray-400 hidden lg:inline">Atualizado em tempo real</span>
           </div>
           
           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {rawContent ? (
                 <div className="max-w-lg mx-auto">
                    <ChordRenderer content={rawContent} fontSize="md" />
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-60">
                    <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-sm font-medium">O resultado aparecerá aqui</p>
                 </div>
              )}
           </div>
        </div>

        {/* Mobile Toggle FAB */}
        <div className="lg:hidden absolute bottom-6 right-6 z-30">
           <button 
             onClick={() => setShowPreviewMobile(!showPreviewMobile)}
             className="h-16 w-16 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center text-xl hover:scale-110 transition-transform touch-manipulation active:scale-95"
           >
             {showPreviewMobile ? (
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
             ) : (
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
             )}
           </button>
        </div>

      </div>

      {/* Key Selector Modal */}
      <KeySelector 
        isOpen={showKeySelector} 
        onClose={() => setShowKeySelector(false)} 
        onSelect={(k) => { setKey(k); setShowKeySelector(false); }} 
        currentKey={key}
      />

    </div>
  );
};

export default SongCreate;