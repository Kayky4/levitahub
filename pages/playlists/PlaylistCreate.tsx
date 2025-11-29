import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPlaylist } from '../../services/playlists';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import { useAuth } from '../../hooks/useAuth';

type EventType = 'worship' | 'rehearsal' | 'special';

interface EventTypeConfig {
  id: EventType;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
}

const EVENT_TYPES: EventTypeConfig[] = [
  { 
    id: 'worship', 
    label: 'Culto', 
    icon: '🎸', 
    color: 'indigo',
    gradient: 'from-indigo-600 to-purple-600',
    description: 'Domingos, Santas Ceias e Celebrações.'
  },
  { 
    id: 'rehearsal', 
    label: 'Ensaio', 
    icon: '🎤', 
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Preparação para escalas e repertório.'
  },
  { 
    id: 'special', 
    label: 'Especial', 
    icon: '✨', 
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    description: 'Conferências, Vigílias ou Eventos.'
  }
];

// Helper to get next specific day (0 = Sunday, 1 = Monday...)
const getNextDayOfWeek = (dayIndex: number) => {
  const date = new Date();
  date.setDate(date.getDate() + (dayIndex + 7 - date.getDay()) % 7 || 7);
  return date;
};

const PlaylistCreate: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isManualTitle, setIsManualTitle] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate title based on Type + Date
  useEffect(() => {
    if (isManualTitle || !selectedType) return;

    const dateObj = new Date(date);
    // Ajuste fuso horário simples para exibição correta do dia da semana
    const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
    const localDate = new Date(dateObj.getTime() + userTimezoneOffset);

    const weekDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(localDate);
    const formattedWeekDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);

    let newTitle = '';
    if (selectedType === 'worship') {
      newTitle = `Culto de ${formattedWeekDay}`;
      if (localDate.getDay() === 0) newTitle = 'Culto de Domingo'; // Force common name
    } else if (selectedType === 'rehearsal') {
      newTitle = `Ensaio Geral`;
    } else {
      newTitle = `Evento Especial`;
    }

    setTitle(newTitle);
  }, [selectedType, date, isManualTitle]);

  const handleDateQuickSelect = (offset: number | 'next_sunday' | 'next_thursday') => {
    const today = new Date();
    let targetDate = new Date();

    if (typeof offset === 'number') {
      targetDate.setDate(today.getDate() + offset);
    } else if (offset === 'next_sunday') {
      targetDate = getNextDayOfWeek(0); // 0 = Sunday
    } else if (offset === 'next_thursday') {
      targetDate = getNextDayOfWeek(4); // 4 = Thursday
    }

    setDate(targetDate.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandId || !selectedType) return;
    setSubmitting(true);

    try {
      await createPlaylist(bandId, {
        title: title || 'Novo Evento',
        date: date,
        description: description || (selectedType === 'rehearsal' ? 'Passagem de som e repertório.' : 'Celebração com a igreja.')
      });
      navigate(`/band/${bandId}/playlists`);
    } catch (error) {
      console.error(error);
      alert('Erro ao criar evento.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeConfig = EVENT_TYPES.find(t => t.id === selectedType);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 transition-colors duration-500 overflow-x-hidden flex flex-col">
      
      {/* Background Ambience */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${selectedType ? 'opacity-20' : 'opacity-0'}`}>
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] bg-gradient-to-b ${activeConfig?.gradient || 'from-gray-500 to-transparent'}`} />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-32">
        
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:bg-transparent text-gray-500 dark:text-gray-400">
            &larr; Voltar
          </Button>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Vamos planejar o próximo <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">evento?</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Selecione o tipo para começarmos.
            </p>
          </motion.div>
        </div>

        <form id="playlist-create-form" onSubmit={handleSubmit} className="space-y-10">
          
          {/* 1. Type Selection */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {EVENT_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(type.id)}
                    className={`
                      relative cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 overflow-hidden
                      ${isSelected 
                        ? `border-${type.color}-500 bg-white dark:bg-white/10 shadow-xl shadow-${type.color}-500/20` 
                        : 'border-transparent bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="activeRing"
                        className={`absolute inset-0 border-2 border-${type.color}-500 rounded-2xl pointer-events-none`} 
                      />
                    )}
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${type.gradient} text-white shadow-lg`}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {type.label}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-1">
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className={`sm:hidden h-6 w-6 rounded-full bg-${type.color}-500 text-white flex items-center justify-center`}>
                          ✓
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* 2. Date & Details (Reveal Animation) */}
          <AnimatePresence>
            {selectedType && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-8"
              >
                {/* Date Selection */}
                <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                     Quando será?
                   </label>
                   
                   {/* Smart Chips */}
                   <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-2">
                      <button 
                        type="button"
                        onClick={() => handleDateQuickSelect(0)}
                        className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30"
                      >
                        Hoje
                      </button>
                      <button 
                         type="button"
                         onClick={() => handleDateQuickSelect(1)}
                         className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30"
                       >
                         Amanhã
                       </button>
                       <button 
                         type="button"
                         onClick={() => handleDateQuickSelect('next_sunday')}
                         className="whitespace-nowrap px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-500/10 hover:bg-purple-200 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-sm font-bold transition-colors border border-purple-200 dark:border-purple-500/20"
                       >
                         Próximo Domingo
                       </button>
                       <button 
                         type="button"
                         onClick={() => handleDateQuickSelect('next_thursday')}
                         className="whitespace-nowrap px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30"
                       >
                         Próxima Quinta
                       </button>
                   </div>

                   <Input
                     type="date"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 h-12"
                   />
                </div>

                {/* Details */}
                <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                   <div className="space-y-4">
                      <Input
                        label="Nome do Evento"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setIsManualTitle(true);
                        }}
                        placeholder="Ex: Culto da Família"
                        className="font-bold text-lg bg-transparent border-0 border-b-2 border-gray-200 dark:border-white/10 rounded-none px-0 focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-gray-300"
                      />
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Descrição (Opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Detalhes extras..."
                          className="w-full bg-gray-50 dark:bg-black/20 border-0 rounded-xl p-4 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-indigo-500/50 resize-none"
                        />
                      </div>
                   </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Sticky Footer Action - Portal to Body to escape PageTransition transform context */}
      {createPortal(
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-midnight-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 z-[60]"
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
             <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                {selectedType ? (
                  <>Criando <strong className="text-gray-900 dark:text-white">{activeConfig?.label}</strong> para <strong className="text-gray-900 dark:text-white">{new Date(date + 'T12:00:00').toLocaleDateString()}</strong></>
                ) : (
                  <span>Selecione um tipo para continuar</span>
                )}
             </div>
             <Button
               type="submit"
               form="playlist-create-form"
               size="lg"
               disabled={!selectedType || submitting}
               isLoading={submitting}
               className={`w-full sm:w-auto px-8 ${selectedType ? `bg-gradient-to-r ${activeConfig?.gradient} border-0 shadow-lg shadow-${activeConfig?.color}-500/20` : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'}`}
             >
               Confirmar e Criar
             </Button>
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
};

export default PlaylistCreate;