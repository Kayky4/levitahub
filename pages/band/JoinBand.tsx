import React, { useState, useRef } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { joinBand } from '../../services/bands';
import Button from '../../components/ui/Button';
import InstrumentPicker from '../../components/band/InstrumentPicker';
import { useToast } from '../../context/ToastContext';

const JoinBand: React.FC = () => {
  const [codeSuffix, setCodeSuffix] = useState('');
  const [instrument, setInstrument] = useState('Vocal');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Handle intelligent code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    
    // If user pastes "BANDA-123456", strip the prefix
    if (val.startsWith('BANDA-')) {
      val = val.replace('BANDA-', '');
    }

    // Limit to 6 chars
    if (val.length <= 6) {
      setCodeSuffix(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (codeSuffix.length < 6) {
      showToast('O código deve ter 6 caracteres.', 'error');
      codeInputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const fullCode = `BANDA-${codeSuffix}`;
      const bandId = await joinBand(fullCode, instrument);
      showToast('Bem-vindo à equipe!', 'success');
      navigate(`/band/${bandId}/dashboard`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao entrar. Verifique o código.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = codeSuffix.length === 6;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex">
      
      {/* LEFT SIDE (Visual - Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-midnight-900 relative overflow-hidden items-center justify-center p-12">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-900/40 to-midnight-900 z-0"></div>
         
         {/* Abstract 3D Shapes */}
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
           className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full border border-white/5 opacity-30 blur-sm"
         />
         <motion.div 
           animate={{ rotate: -360 }}
           transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
           className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full border border-white/5 opacity-20 blur-sm"
         />

         <div className="relative z-10 max-w-md text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-2xl shadow-indigo-500/30 mb-8">
                 <span className="text-4xl">🎟️</span>
              </div>
              <h1 className="text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                Seu Passe de <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Bastidores</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed">
                Conecte-se ao seu ministério, acesse o repertório em tempo real e sincronize com a banda.
              </p>
            </motion.div>
         </div>
      </div>

      {/* RIGHT SIDE (Form - Interactive) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-12 lg:p-24 relative">
         
         {/* Mobile Header */}
         <div className="lg:hidden mb-8">
            <button onClick={() => navigate(-1)} className="text-gray-500 mb-4 flex items-center gap-2">
               &larr; Voltar
            </button>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Entrar na Banda</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Insira o código de acesso do time.</p>
         </div>

         <form onSubmit={handleSubmit} className="max-w-md w-full mx-auto space-y-8">
            
            {/* SMART CODE INPUT - REFACTORED FOR PERFECT ALIGNMENT */}
            <div>
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">
                 Código da Banda
               </label>
               
               <div className={`
                 flex items-center w-full transition-all duration-300 rounded-2xl border-2 overflow-hidden bg-white dark:bg-black/20
                 ${isCodeComplete 
                    ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                    : 'border-gray-200 dark:border-white/10 focus-within:border-indigo-500 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                 }
               `}>
                  {/* Fixed Height Container for Prefix to ensure vertical centering */}
                  <div className="flex items-center justify-center h-16 sm:h-20 px-4 sm:px-6 bg-gray-50 dark:bg-white/5 border-r border-gray-200 dark:border-white/5 select-none">
                     <span className="text-sm sm:text-base font-bold text-gray-400 tracking-widest font-mono">BANDA-</span>
                  </div>
                  
                  {/* Input Container */}
                  <div className="flex-1 relative h-16 sm:h-20">
                    <input
                      ref={codeInputRef}
                      type="text"
                      value={codeSuffix}
                      onChange={handleCodeChange}
                      className="w-full h-full bg-transparent border-none outline-none text-center text-2xl sm:text-3xl font-black text-gray-800 dark:text-white tracking-[0.2em] font-mono uppercase placeholder-gray-300 dark:placeholder-gray-600/50 focus:ring-0 px-2"
                      placeholder="XXXXXX"
                      maxLength={6}
                      autoFocus
                    />
                    
                    {/* Success Icon Indicator (Absolute Positioned) */}
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ${isCodeComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                       <div className="bg-green-100 dark:bg-green-500/20 p-1 rounded-full">
                         <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                    </div>
                  </div>
               </div>
               
               <p className="mt-2 text-xs text-gray-400 text-right pr-1">Peça o código ao seu líder</p>
            </div>

            {/* INSTRUMENT PICKER */}
            <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
               <InstrumentPicker selected={instrument} onChange={setInstrument} />
            </div>

            {/* ACTIONS */}
            <div className="pt-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
               <Button
                 type="submit"
                 size="lg"
                 isLoading={loading}
                 disabled={!isCodeComplete}
                 className={`w-full text-lg h-16 rounded-2xl shadow-xl transition-all ${isCodeComplete ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02]' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}
               >
                 Validar e Entrar
               </Button>
               
               <button 
                 type="button"
                 onClick={() => navigate('/dashboard')}
                 className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-2"
               >
                 Cancelar
               </button>
            </div>

         </form>
      </div>
    </div>
  );
};

export default JoinBand;