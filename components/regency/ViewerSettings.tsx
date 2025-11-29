
import React from 'react';
import { motion } from 'framer-motion';

interface ViewerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    fontSize: number;
    highContrast: boolean;
    lineHeight: number;
  };
  onUpdate: (key: string, value: any) => void;
}

const ViewerSettings: React.FC<ViewerSettingsProps> = ({ isOpen, onClose, settings, onUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Ajustes de Visualização</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">✕</button>
          </div>

          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400 font-bold uppercase">Tamanho da Fonte</label>
                <span className="text-sm text-indigo-400 font-mono">{settings.fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="12" 
                max="48" 
                value={settings.fontSize} 
                onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>A</span>
                <span className="text-lg">A</span>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400 font-bold uppercase">Espaçamento</label>
                <span className="text-sm text-indigo-400 font-mono">{settings.lineHeight}x</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1"
                value={settings.lineHeight} 
                onChange={(e) => onUpdate('lineHeight', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm text-gray-400 font-bold uppercase block">Alto Contraste</label>
                <p className="text-xs text-gray-600">Amarelo sobre preto (ideal para palco)</p>
              </div>
              <button 
                onClick={() => onUpdate('highContrast', !settings.highContrast)}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.highContrast ? 'bg-yellow-500' : 'bg-gray-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ViewerSettings;
