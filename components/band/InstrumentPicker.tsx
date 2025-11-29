import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  selected: string;
  onChange: (value: string) => void;
}

const INSTRUMENTS = [
  { 
    id: 'Vocal', 
    label: 'Vocal', 
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
  },
  { 
    id: 'Violão', 
    label: 'Violão', 
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
  },
  { 
    id: 'Guitarra', 
    label: 'Guitarra', 
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 
  },
  { 
    id: 'Teclado', 
    label: 'Teclado', 
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
  },
  { 
    id: 'Baixo', 
    label: 'Baixo', 
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
  },
  { 
    id: 'Bateria', 
    label: 'Bateria', 
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
  },
];

const InstrumentPicker: React.FC<Props> = ({ selected, onChange }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    // Check if initial selected value is one of the presets
    const isPreset = INSTRUMENTS.some(i => i.id === selected);
    if (selected && !isPreset) {
      setIsCustom(true);
      setCustomValue(selected);
    }
  }, []);

  const handlePresetClick = (id: string) => {
    setIsCustom(false);
    onChange(id);
  };

  const handleCustomChange = (val: string) => {
    setCustomValue(val);
    onChange(val);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Qual seu papel principal?
      </label>
      
      <div className="grid grid-cols-3 gap-3">
        {INSTRUMENTS.map((inst) => {
          const isSelected = selected === inst.id && !isCustom;
          return (
            <motion.button
              key={inst.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePresetClick(inst.id)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-h-[80px]
                ${isSelected 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
                }
              `}
            >
              <div className={`mb-1 ${isSelected ? 'text-white' : 'text-current opacity-70'}`}>
                {inst.icon}
              </div>
              <span className="text-xs font-bold">{inst.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Toggle */}
      <div className="pt-2">
        {!isCustom ? (
          <button
            type="button"
            onClick={() => { setIsCustom(true); onChange(''); }}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Outro instrumento? Clique aqui
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <input
              type="text"
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Digite seu instrumento (ex: Saxofone)"
              className="w-full bg-white dark:bg-black/20 border border-indigo-500 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-gray-900 dark:text-white"
              autoFocus
            />
            <button 
              type="button"
              onClick={() => { setIsCustom(false); onChange('Vocal'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InstrumentPicker;