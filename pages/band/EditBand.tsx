import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBandDetails, getBandMembers, updateBand, deleteBand, canEditBand, canDeleteBand } from '../../services/bands';
import { Band, UserRole } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

const THEMES = [
  { id: 'indigo', gradient: 'from-indigo-600 via-purple-600 to-pink-600', label: 'Royal' },
  { id: 'blue', gradient: 'from-blue-600 via-cyan-500 to-teal-400', label: 'Ocean' },
  { id: 'emerald', gradient: 'from-emerald-600 via-green-500 to-lime-400', label: 'Nature' },
  { id: 'rose', gradient: 'from-rose-600 via-orange-500 to-amber-400', label: 'Sunset' },
  { id: 'midnight', gradient: 'from-slate-800 via-slate-700 to-slate-600', label: 'Midnight' },
  { id: 'fuchsia', gradient: 'from-fuchsia-600 via-pink-600 to-purple-600', label: 'Neon' },
  { id: 'amber', gradient: 'from-amber-500 via-orange-600 to-red-500', label: 'Fire' },
];

const EditBand: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [logoSymbol, setLogoSymbol] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [bandCode, setBandCode] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!bandId || !user) return;

    const load = async () => {
      try {
        const [bandData, membersData] = await Promise.all([
          getBandDetails(bandId),
          getBandMembers(bandId)
        ]);

        if (!bandData) {
          navigate('/dashboard');
          return;
        }

        const me = membersData.find(m => m.userId === user.uid);
        if (!me || !canEditBand(me.role)) {
          showToast('Você não tem permissão para editar esta banda.', 'error');
          navigate(`/band/${bandId}/dashboard`);
          return;
        }

        setUserRole(me.role);
        setName(bandData.name);
        setCity(bandData.city || '');
        setDescription(bandData.description || '');
        setBandCode(bandData.code);
        setLogoSymbol(bandData.logoSymbol || bandData.name.substring(0, 2).toUpperCase());

        // Find theme based on gradient string, or default to first
        const matchedTheme = THEMES.find(t => t.gradient === bandData.themeColor) || THEMES[0];
        setSelectedTheme(matchedTheme);

      } catch (err) {
        console.error(err);
        showToast('Erro ao carregar dados.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bandId, user, navigate, showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandId) return;
    
    if (!name.trim()) {
      showToast('Nome é obrigatório.', 'error');
      return;
    }

    setSaving(true);

    try {
      await updateBand(bandId, { 
        name, 
        city, 
        description,
        themeColor: selectedTheme.gradient,
        logoSymbol: logoSymbol.toUpperCase().substring(0, 2)
      });
      showToast('Alterações salvas com sucesso!', 'success');
      navigate(`/band/${bandId}/dashboard`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar alterações.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bandId || !userRole) return;
    
    const confirmName = prompt(`SEGURANÇA ADICIONAL: Digite "${name}" para confirmar a exclusão definitiva:`);
    if (confirmName !== name) {
      showToast('Nome incorreto. Ação cancelada.', 'info');
      setIsDeleteModalOpen(false);
      return;
    }

    setDeleting(true);
    try {
      await deleteBand(bandId);
      showToast('Banda excluída com sucesso.', 'info');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir banda.', 'error');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex items-center justify-center text-gray-900 dark:text-white">
       <div className="animate-pulse flex flex-col items-center">
         <div className="h-4 w-32 bg-gray-300 dark:bg-white/10 rounded mb-2"></div>
         <div className="text-sm text-gray-500">Carregando estúdio...</div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex overflow-hidden">
      
      {/* LEFT SIDE: Live Preview (Similar to CreateBand but with Edit Context) */}
      <div className="hidden lg:flex w-1/2 bg-midnight-900 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className={`absolute inset-0 bg-gradient-to-br ${selectedTheme.gradient} opacity-10 transition-all duration-700`}></div>
         
         {/* Floating Shapes */}
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 100, ease: "linear", repeat: Infinity }}
           className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
         />

         {/* The LIVE CARD */}
         <div className="relative z-10 w-full max-w-md">
            <div className="text-center mb-8">
               <h3 className="text-indigo-300 text-xs font-bold tracking-[0.2em] uppercase mb-2">Live Preview</h3>
               <p className="text-gray-400 text-sm">Visualize as alterações em tempo real.</p>
            </div>

            <motion.div 
              layout
              className="bg-white dark:bg-midnight-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
               {/* Card Header */}
               <div className={`h-32 bg-gradient-to-r ${selectedTheme.gradient} relative p-6 transition-all duration-500`}>
                  <div className="absolute top-0 right-0 p-24 bg-white opacity-10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
               </div>

               {/* Card Body */}
               <div className="px-8 pb-8 relative">
                  <div className="-mt-12 mb-4">
                     <div className="h-24 w-24 bg-white dark:bg-midnight-700 rounded-2xl shadow-lg flex items-center justify-center text-4xl p-1 border-4 border-white dark:border-midnight-800 transition-all">
                        <span className={`font-black bg-gradient-to-br ${selectedTheme.gradient} bg-clip-text text-transparent uppercase`}>
                           {logoSymbol || '?'}
                        </span>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                        {name || 'Nome da Banda'}
                     </h1>
                     <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{city || 'Cidade, UF'}</span>
                        {description && <span>•</span>}
                     </div>
                     {description && (
                       <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                         {description}
                       </p>
                     )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                     <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 border-2 border-white dark:border-midnight-800 flex items-center justify-center text-[10px] text-gray-500">
                          EU
                        </div>
                     </div>
                     <div className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                        Entrar &rarr;
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-12 overflow-y-auto bg-white dark:bg-midnight-900">
         <div className="max-w-lg mx-auto w-full pt-8 lg:pt-0">
            
            <div className="flex items-center justify-between mb-8">
               <button onClick={() => navigate(`/band/${bandId}/dashboard`)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-2 transition-colors">
                  &larr; Voltar ao Painel
               </button>
               {userRole && canDeleteBand(userRole) && (
                 <button onClick={() => setIsDeleteModalOpen(true)} className="text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-wider">
                    Excluir Banda
                 </button>
               )}
            </div>

            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Personalização</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Edite a identidade visual e informações da banda.</p>

            <form onSubmit={handleSave} className="space-y-8">
               
               {/* SECTION 1: IDENTITY */}
               <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5 space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identidade & Logo</h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                     <div className="col-span-3">
                       <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">Nome da Banda</label>
                       <input 
                         type="text"
                         value={name}
                         onChange={e => setName(e.target.value)}
                         className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                     </div>
                     <div className="col-span-1">
                       <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2" title="Máximo 2 caracteres">Símbolo</label>
                       <input 
                         type="text"
                         value={logoSymbol}
                         maxLength={2}
                         onChange={e => setLogoSymbol(e.target.value.toUpperCase())}
                         className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-center font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                         placeholder="Ex: LH"
                       />
                     </div>
                  </div>
               </div>

               {/* SECTION 2: THEME */}
               <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tema Visual</h3>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                     {THEMES.map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme)}
                          className={`
                            relative w-full aspect-square rounded-xl bg-gradient-to-br ${theme.gradient} 
                            transition-all transform hover:scale-105
                            ${selectedTheme.id === theme.id ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-midnight-900 ring-indigo-500 scale-110 z-10' : 'opacity-70 hover:opacity-100'}
                          `}
                          title={theme.label}
                        >
                           {selectedTheme.id === theme.id && (
                             <div className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</div>
                           )}
                        </button>
                     ))}
                  </div>
                  <p className="text-xs text-gray-400">O tema define as cores do painel e do cartão da banda.</p>
               </div>

               {/* SECTION 3: DETAILS */}
               <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5 space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalhes Gerais</h3>
                  
                  <Input 
                    label="Cidade"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="bg-white dark:bg-black/20 border-gray-200 dark:border-white/10"
                  />
                  
                  <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Descrição</label>
                     <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Informações adicionais sobre a banda..."
                        rows={3}
                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                     />
                  </div>
               </div>

               {/* SECTION 4: CODE (Read Only) */}
               <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Código de Acesso</span>
                  <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-lg">{bandCode}</code>
               </div>

               <div className="pt-4 pb-12">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full text-lg shadow-2xl shadow-indigo-500/20"
                    isLoading={saving}
                  >
                     Salvar Alterações
                  </Button>
               </div>

            </form>
         </div>
      </div>

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen}
        title="Excluir Banda Definitivamente"
        message={`Você está prestes a apagar a banda "${name}". Todo o histórico de músicas, playlists e membros será perdido. Tem certeza absoluta?`}
        variant="danger"
        confirmLabel="Sim, Excluir"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={deleting}
      />
    </div>
  );
};

export default EditBand;