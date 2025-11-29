import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (key: string) => void;
  currentKey: string;
}

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const KeySelector: React.FC<Props> = ({ isOpen, onClose, onSelect, currentKey }) => {
  const [modifier, setModifier] = useState<'' | '#' | 'b'>('');
  const [isMinor, setIsMinor] = useState(false);

  // Helper to construct the key string to preview
  const getPreview = (note: string) => {
    return `${note}${modifier}${isMinor ? 'm' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white dark:bg-midnight-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-6">
           <div className="text-center mb-6">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Selecionar Tom</h3>
             <p className="text-xs text-gray-500">Toque na nota fundamental</p>
           </div>

           {/* Grid of Notes */}
           <div className="grid grid-cols-4 gap-3 mb-6">
              {NOTES.map(note => (
                <button
                  key={note}
                  onClick={() => onSelect(getPreview(note))}
                  className={`
                    h-16 rounded-xl text-xl font-black transition-all border-2
                    ${currentKey.startsWith(note) 
                       ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105' 
                       : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    }
                  `}
                >
                   {note}
                   <span className="text-xs font-normal align-top ml-0.5 opacity-70">
                     {modifier}{isMinor ? 'm' : ''}
                   </span>
                </button>
              ))}
           </div>

           {/* Modifiers Control */}
           <div className="bg-gray-100 dark:bg-black/30 rounded-xl p-2 flex gap-2">
              <button 
                onClick={() => setModifier(modifier === '#' ? '' : '#')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${modifier === '#' ? 'bg-white dark:bg-white/20 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}
              >
                # (Sustenido)
              </button>
              <button 
                onClick={() => setModifier(modifier === 'b' ? '' : 'b')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${modifier === 'b' ? 'bg-white dark:bg-white/20 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}
              >
                b (Bemol)
              </button>
              <button 
                onClick={() => setIsMinor(!isMinor)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${isMinor ? 'bg-white dark:bg-white/20 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}
              >
                m (Menor)
              </button>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
           <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white px-4 py-2">
             Cancelar
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default KeySelector;
