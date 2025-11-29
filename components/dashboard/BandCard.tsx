import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNextBandEvent } from '../../services/playlists';
import { Playlist } from '../../services/types';
import Badge from '../ui/Badge';

interface BandCardProps {
  id: string;
  name: string;
  role: string;
  index: number;
}

const GRADIENTS = [
  'from-violet-600 to-indigo-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-500',
  'from-amber-500 to-orange-600',
  'from-fuchsia-600 to-purple-600',
];

const BandCard: React.FC<BandCardProps> = ({ id, name, role, index }) => {
  const navigate = useNavigate();
  const [nextEvent, setNextEvent] = useState<Playlist | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  // Deterministic gradient based on band ID char code sum
  const gradientIndex = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % GRADIENTS.length;
  const gradientClass = GRADIENTS[gradientIndex];

  useEffect(() => {
    let isMounted = true;
    const fetchEvent = async () => {
      try {
        const event = await getNextBandEvent(id);
        if (isMounted) setNextEvent(event);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingEvent(false);
      }
    };
    fetchEvent();
    return () => { isMounted = false; };
  }, [id]);

  const handleCardClick = () => {
    navigate(`/band/${id}/dashboard`);
  };

  const handleQuickAction = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(`/band/${id}/${path}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleCardClick}
      className="group relative w-full h-full rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-midnight-800 border border-gray-200 dark:border-white/5 flex flex-col"
    >
      {/* Visual Header / Brand Area */}
      <div className={`h-24 bg-gradient-to-r ${gradientClass} relative p-6`}>
        <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:opacity-10 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white dark:from-midnight-800 to-transparent"></div>
        
        <div className="relative z-10 flex justify-between items-start">
           <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
             {role}
           </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="px-6 pb-6 pt-2 flex-1 flex flex-col justify-between relative z-20">
        <div>
          <div className="-mt-10 mb-3">
             <div className="h-16 w-16 bg-white dark:bg-midnight-700 rounded-2xl shadow-lg flex items-center justify-center text-3xl p-1 border-4 border-white dark:border-midnight-800">
                <span className={`font-bold bg-gradient-to-br ${gradientClass} bg-clip-text text-transparent`}>
                  {name.charAt(0).toUpperCase()}
                </span>
             </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </h3>

          {/* Next Event Section */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5 mb-4 group-hover:border-indigo-100 dark:group-hover:border-white/10 transition-colors">
             <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Próximo Evento</p>
             {loadingEvent ? (
               <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded animate-pulse"></div>
             ) : nextEvent ? (
               <div className="flex items-center gap-3">
                 <div className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 rounded-lg px-2 py-1 text-center min-w-[3rem]">
                    <span className="block text-[10px] font-bold text-red-500 uppercase">{new Date(nextEvent.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                    <span className="block text-lg font-bold text-gray-900 dark:text-white leading-none">{new Date(nextEvent.date).getDate()}</span>
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{nextEvent.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{nextEvent.songs.length} músicas</p>
                 </div>
               </div>
             ) : (
               <p className="text-xs text-gray-500 italic">Nenhum evento agendado.</p>
             )}
          </div>
        </div>

        {/* Quick Actions Footer - Increased hit areas */}
        <div className="grid grid-cols-3 gap-3 mt-2 pt-4 border-t border-gray-100 dark:border-white/5">
           <button 
             onClick={(e) => handleQuickAction(e, 'songs')}
             className="flex flex-col items-center justify-center p-3 min-h-[56px] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/btn touch-manipulation active:bg-gray-100 dark:active:bg-white/10"
             title="Músicas"
           >
             <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-pink-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
             <span className="text-[10px] font-medium text-gray-500 mt-1">Músicas</span>
           </button>
           <button 
             onClick={(e) => handleQuickAction(e, 'playlists')}
             className="flex flex-col items-center justify-center p-3 min-h-[56px] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/btn touch-manipulation active:bg-gray-100 dark:active:bg-white/10"
             title="Playlists"
           >
             <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             <span className="text-[10px] font-medium text-gray-500 mt-1">Eventos</span>
           </button>
           <button 
             onClick={(e) => handleQuickAction(e, 'members')}
             className="flex flex-col items-center justify-center p-3 min-h-[56px] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/btn touch-manipulation active:bg-gray-100 dark:active:bg-white/10"
             title="Membros"
           >
             <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             <span className="text-[10px] font-medium text-gray-500 mt-1">Equipe</span>
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BandCard;