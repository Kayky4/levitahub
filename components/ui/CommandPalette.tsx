import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const CommandPalette: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Mock actions - in a real app, this would filter based on real data
  const actions = [
    { id: 'home', label: 'Ir para Dashboard', icon: '🏠', action: () => navigate('/dashboard') },
    { id: 'create-band', label: 'Criar Nova Banda', icon: '🎸', action: () => navigate('/band/create') },
    { id: 'join-band', label: 'Entrar em Banda', icon: '🔗', action: () => navigate('/band/join') },
  ].filter(a => a.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-midnight-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center border-b border-white/10 px-4 py-3">
          <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm"
            placeholder="O que você procura?"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="text-xs text-gray-500 border border-white/10 rounded px-1.5">ESC</span>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto py-2">
          {actions.length === 0 ? (
             <div className="px-4 py-8 text-center text-gray-500 text-sm">Nenhum resultado encontrado.</div>
          ) : (
             actions.map((item, idx) => (
               <button
                 key={item.id}
                 onClick={() => { item.action(); setIsOpen(false); }}
                 className="w-full text-left px-4 py-2 hover:bg-indigo-600/20 hover:border-l-2 hover:border-indigo-500 flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors group"
               >
                 <span className="opacity-60 group-hover:opacity-100">{item.icon}</span>
                 {item.label}
               </button>
             ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CommandPalette;