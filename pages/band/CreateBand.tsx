import React, { useState } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createBand } from '../../services/bands';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

const THEMES = [
   { id: 'indigo', gradient: 'from-indigo-600 via-purple-600 to-pink-600', label: 'Royal' },
   { id: 'blue', gradient: 'from-blue-600 via-cyan-500 to-teal-400', label: 'Ocean' },
   { id: 'emerald', gradient: 'from-emerald-600 via-green-500 to-lime-400', label: 'Nature' },
   { id: 'rose', gradient: 'from-rose-600 via-orange-500 to-amber-400', label: 'Sunset' },
   { id: 'midnight', gradient: 'from-slate-800 via-slate-700 to-slate-600', label: 'Midnight' },
];

const CreateBand: React.FC = () => {
   const navigate = useNavigate();
   const { showToast } = useToast();

   // Form State
   const [name, setName] = useState('');
   const [city, setCity] = useState('');
   const [description, setDescription] = useState('');
   const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
   const [enableTrial, setEnableTrial] = useState(true);

   const [loading, setLoading] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) {
         showToast('O nome da banda é obrigatório.', 'error');
         return;
      }

      setLoading(true);

      try {
         // 1. Create Band
         const bandId = await createBand(
            name,
            city,
            selectedTheme.gradient,
            description
         );

         // Trial is now automatic in createBand service

         showToast('Banda criada com sucesso!', 'success');
         navigate(`/band/${bandId}/dashboard`);

      } catch (err: any) {
         console.error(err);
         showToast('Erro ao criar banda. Tente novamente.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex overflow-hidden">

         {/* LEFT SIDE: Live Preview (Desktop Only) */}
         <div className="hidden lg:flex w-1/2 bg-midnight-900 relative items-center justify-center p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className={`absolute inset-0 bg-gradient-to-br ${selectedTheme.gradient} opacity-10 transition-all duration-500`}></div>

            {/* Floating Shapes */}
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 100, ease: "linear", repeat: Infinity }}
               className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
            />
            <motion.div
               animate={{ rotate: -360 }}
               transition={{ duration: 120, ease: "linear", repeat: Infinity }}
               className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            />

            {/* The LIVE CARD */}
            <div className="relative z-10 w-full max-w-md">
               <div className="text-center mb-8">
                  <h3 className="text-indigo-300 text-xs font-bold tracking-[0.2em] uppercase mb-2">Preview em Tempo Real</h3>
                  <p className="text-gray-400 text-sm">É assim que sua banda aparecerá para a equipe.</p>
               </div>

               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-midnight-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
               >
                  {/* Card Header */}
                  <div className={`h-32 bg-gradient-to-r ${selectedTheme.gradient} relative p-6 transition-all duration-500`}>
                     <div className="absolute top-0 right-0 p-24 bg-white opacity-10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute bottom-4 right-6">
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                           LÍDER
                        </div>
                     </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-8 pb-8 relative">
                     <div className="-mt-12 mb-4">
                        <div className="h-24 w-24 bg-white dark:bg-midnight-700 rounded-2xl shadow-lg flex items-center justify-center text-4xl p-1 border-4 border-white dark:border-midnight-800 transition-all">
                           <span className={`font-black bg-gradient-to-br ${selectedTheme.gradient} bg-clip-text text-transparent`}>
                              {name ? name.charAt(0).toUpperCase() : '?'}
                           </span>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                           {name || 'Nome da Banda'}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                           <span>{city || 'Cidade, UF'}</span>
                           <span>•</span>
                           <span>1 Membro</span>
                        </div>
                        {description && (
                           <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                              {description}
                           </p>
                        )}
                     </div>

                     <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <div className="flex -space-x-2">
                           <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 border-2 border-white dark:border-midnight-800 flex items-center justify-center text-[10px] font-bold text-gray-500">?</div>
                        </div>
                        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                           Ver Painel &rarr;
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>

         {/* RIGHT SIDE: Form */}
         <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-12 lg:p-24 relative overflow-y-auto bg-gray-50 dark:bg-midnight-900">

            <div className="max-w-lg mx-auto w-full">
               <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mb-6 flex items-center gap-2 transition-colors">
                  &larr; Cancelar
               </button>

               <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Vamos criar sua banda.</h2>
               <p className="text-gray-500 dark:text-gray-400 mb-10">Configure a identidade visual e os detalhes do seu ministério.</p>

               <form onSubmit={handleSubmit} className="space-y-10">

                  {/* 1. BASIC INFO */}
                  <div className="space-y-6">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Nome da Banda</label>
                        <input
                           type="text"
                           value={name}
                           onChange={e => setName(e.target.value)}
                           placeholder="Ex: Louvor Central"
                           className="w-full text-xl md:text-2xl font-bold bg-transparent border-b-2 border-gray-200 dark:border-white/10 py-2 px-1 focus:border-indigo-500 focus:outline-none transition-colors placeholder-gray-300 dark:placeholder-gray-700 text-gray-900 dark:text-white"
                           autoFocus
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <Input
                           label="Cidade (Opcional)"
                           value={city}
                           onChange={e => setCity(e.target.value)}
                           placeholder="São Paulo, SP"
                           className="bg-white dark:bg-black/20 border-gray-200 dark:border-white/10"
                        />
                        <div>
                           <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Tema Visual</label>
                           <div className="flex gap-2 items-center h-[48px]">
                              {THEMES.map(theme => (
                                 <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => setSelectedTheme(theme)}
                                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.gradient} transition-all transform hover:scale-110 ${selectedTheme.id === theme.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'}`}
                                    title={theme.label}
                                 />
                              ))}
                           </div>
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Descrição (Opcional)</label>
                        <textarea
                           value={description}
                           onChange={e => setDescription(e.target.value)}
                           placeholder="Uma breve frase sobre o propósito da banda..."
                           rows={2}
                           className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                        />
                     </div>
                  </div>

                  {/* 2. TRIAL ACTIVATION */}
                  <div
                     className={`relative overflow-hidden rounded-2xl p-1 transition-all duration-500 ${enableTrial ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-gray-200 dark:bg-white/10'}`}
                  >
                     <div className="bg-white dark:bg-midnight-800 rounded-xl p-5 flex items-center justify-between relative z-10">
                        <div>
                           <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              Ativar Trial Premium
                              {enableTrial && <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Grátis</span>}
                           </h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                              Teste o Modo Regência e Playlists ilimitadas por 14 dias. Sem compromisso.
                           </p>
                        </div>
                        <button
                           type="button"
                           onClick={() => setEnableTrial(!enableTrial)}
                           className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${enableTrial ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                           <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enableTrial ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                     </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="pt-4">
                     <Button
                        type="submit"
                        size="lg"
                        className="w-full text-lg shadow-2xl shadow-indigo-500/20"
                        isLoading={loading}
                     >
                        Lançar Banda 🚀
                     </Button>
                     <p className="text-center text-xs text-gray-400 mt-4">
                        Ao criar, você concorda com os Termos de Uso do LevitaHub.
                     </p>
                  </div>

               </form>
            </div>
         </div>
      </div>
   );
};

export default CreateBand;