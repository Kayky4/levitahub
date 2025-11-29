import React from 'react';
import GlassCard from '../../components/ui/GlassCard';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';

const AppSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Configurações</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Preferências gerais do aplicativo.</p>

      <div className="space-y-6">
        {/* Appearance Section */}
        <GlassCard>
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🎨</span> Aparência
           </h3>
           <div className="flex items-center justify-between">
              <div>
                 <p className="font-medium text-gray-900 dark:text-white">Tema do Aplicativo</p>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Escolha entre modo claro ou escuro.</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-black/30 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                 <button
                   onClick={() => setTheme('light')}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                 >
                    ☀️ Claro
                 </button>
                 <button
                   onClick={() => setTheme('dark')}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                 >
                    🌙 Escuro
                 </button>
              </div>
           </div>
        </GlassCard>

        {/* Notifications Section (Mock) */}
        <GlassCard>
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🔔</span> Notificações
           </h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="font-medium text-gray-900 dark:text-white">Alertas de Regência</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receber avisos quando uma sessão começar.</p>
                 </div>
                 <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle1" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-600"/>
                    <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer checked:bg-indigo-600"></label>
                 </div>
              </div>
              <hr className="border-gray-200 dark:border-white/10" />
              <div className="flex items-center justify-between">
                 <div>
                    <p className="font-medium text-gray-900 dark:text-white">Emails de Marketing</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receber novidades sobre o LevitaHub.</p>
                 </div>
                 <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer right-6"/>
                    <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                 </div>
              </div>
           </div>
           <style>{`
              .toggle-checkbox:checked {
                right: 0;
                border-color: #68D391;
              }
              .toggle-checkbox:checked + .toggle-label {
                background-color: #68D391;
              }
              .toggle-checkbox {
                 right: 1.5rem;
                 transition: all 0.3s;
              }
           `}</style>
        </GlassCard>

        {/* Danger Zone */}
        <div className="border border-red-200 dark:border-red-500/20 rounded-2xl p-6 bg-red-50 dark:bg-red-500/5">
           <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Zona de Perigo</h3>
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ações irreversíveis relacionadas à sua conta.
           </p>
           <Button variant="danger" onClick={() => alert("Funcionalidade em desenvolvimento.")}>
              Excluir minha conta
           </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;