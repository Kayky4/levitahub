import React, { useEffect, useState, useMemo } from 'react';
// @ts-ignore
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getBandSongs, canEditMusic, deleteSong } from '../../services/songs';
import { getBandMembers } from '../../services/bands';
import { getBandBilling, canUseFeature, getFeatureTooltip } from '../../services/billing';
import { Song, BandBilling } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import KeyBadge from '../../components/songs/KeyBadge';
import Modal from '../../components/ui/Modal';

// Filter Types
type SortField = 'title' | 'artist' | 'createdAt' | 'key';
type SortDirection = 'asc' | 'desc';

const SongList: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Data State
  const [songs, setSongs] = useState<Song[]>([]);
  const [billing, setBilling] = useState<BandBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [keyFilter, setKeyFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Delete State
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  useEffect(() => {
    if (!bandId || !user) return;

    const load = async () => {
      try {
        const [songsData, membersData, billingData] = await Promise.all([
          getBandSongs(bandId),
          getBandMembers(bandId),
          getBandBilling(bandId)
        ]);
        setSongs(songsData);
        setBilling(billingData);

        const me = membersData.find(m => m.userId === user.uid);
        if (me) {
          setCanCreate(canEditMusic(me.role));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bandId, user]);

  // Derived State: Unique Keys for Filter
  const availableKeys = useMemo(() => {
    const keys = new Set(songs.map(s => s.key).filter(Boolean));
    return Array.from(keys).sort();
  }, [songs]);

  // Derived State: Filtered & Sorted Songs
  const filteredSongs = useMemo(() => {
    let result = songs;

    // 1. Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(lower) || 
        s.artist.toLowerCase().includes(lower)
      );
    }

    // 2. Key Filter
    if (keyFilter !== 'all') {
      result = result.filter(s => s.key === keyFilter);
    }

    // 3. Sort
    result.sort((a, b) => {
      const fieldA = a[sortField]?.toString().toLowerCase() || '';
      const fieldB = b[sortField]?.toString().toLowerCase() || '';
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [songs, searchTerm, keyFilter, sortField, sortDirection]);

  // Handlers
  const handleDeleteClick = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation(); // Prevent navigation
    setSongToDelete(song);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bandId || !songToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSong(bandId, songToDelete.id);
      setSongs(prev => prev.filter(s => s.id !== songToDelete.id));
      setIsDeleteModalOpen(false);
      setSongToDelete(null);
      showToast('Música excluída com sucesso.', 'success');
    } catch (error) {
      showToast('Erro ao excluir música.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllowed = billing ? canUseFeature('create_song', billing.subscriptionStatus) : false;
  const tooltip = billing ? getFeatureTooltip('create_song', billing.subscriptionStatus) : "Carregando...";

  // Sort Toggle Helper
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
       <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 p-8 pt-24 space-y-4">
         {[1,2,3,4,5].map(i => <Skeleton key={i} height="5rem" className="bg-gray-200 dark:bg-white/5 rounded-xl" variant="rectangular" />)}
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 font-sans pb-24 transition-colors duration-300">
      
      {/* 1. Header & Stats */}
      <div className="bg-white dark:bg-midnight-900 border-b border-gray-200 dark:border-white/5 pt-6 pb-6">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/band/${bandId}/dashboard`} className="text-xs font-bold text-gray-500 hover:text-indigo-500 uppercase tracking-wide p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
                      &larr; Voltar
                    </Link>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    Repertório
                    <span className="ml-3 text-lg font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg align-middle">
                      {songs.length}
                    </span>
                  </h1>
               </div>
               
               {/* Desktop Create Button */}
               {canCreate && (
                 <div className="hidden md:block relative group">
                   <Button 
                     variant="primary"
                     onClick={() => navigate(`/band/${bandId}/songs/create`)}
                     disabled={!isAllowed}
                     className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                     leftIcon={<span>+</span>}
                   >
                     Nova Música
                   </Button>
                   {!isAllowed && (
                     <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-56 p-2 bg-black text-white text-xs rounded shadow-lg z-30 border border-white/10">
                       {tooltip}
                     </div>
                   )}
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* 2. Sticky Smart Filter Bar */}
      <div className="sticky top-16 z-30 bg-white/80 dark:bg-midnight-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 shadow-sm transition-all">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row gap-3">
               
               {/* Search Input */}
               <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/10 rounded-lg leading-5 bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors min-h-[48px]"
                    placeholder="Buscar título ou artista..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               {/* Filters & Sort */}
               <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
                  
                  {/* Key Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={keyFilter}
                      onChange={(e) => setKeyFilter(e.target.value)}
                      className="pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-indigo-500 min-h-[48px] appearance-none"
                    >
                       <option value="all">Todos os Tons</option>
                       {availableKeys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  {/* Sort Toggles */}
                  <button 
                    onClick={() => toggleSort('title')}
                    className={`whitespace-nowrap px-4 py-2 border rounded-lg text-sm font-medium transition-colors min-h-[48px] ${sortField === 'title' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                  >
                    A-Z {sortField === 'title' && (sortDirection === 'asc' ? '↓' : '↑')}
                  </button>
                  
                  <button 
                    onClick={() => toggleSort('createdAt')}
                    className={`whitespace-nowrap px-4 py-2 border rounded-lg text-sm font-medium transition-colors min-h-[48px] ${sortField === 'createdAt' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}
                  >
                    Recentes {sortField === 'createdAt' && (sortDirection === 'asc' ? '↓' : '↑')}
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* 3. Main List Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredSongs.length === 0 ? (
          <EmptyState 
            title={searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Repertório Vazio"}
            description={searchTerm ? "Tente buscar por outro termo." : "Adicione sua primeira música para começar."}
            actionLabel={!searchTerm && canCreate && isAllowed ? "Criar Música" : undefined}
            onAction={() => navigate(`/band/${bandId}/songs/create`)}
            icon={<span className="text-4xl">🎵</span>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
             {filteredSongs.map((song) => (
               <motion.div
                 layout
                 key={song.id}
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
                 className="group relative flex items-center bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl transition-all hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm min-h-[80px]"
               >
                 {/* Key Badge Area (Left) */}
                 <Link to={`/band/${bandId}/songs/${song.id}`} className="flex-1 flex items-center py-4 pl-4 pr-2 min-w-0 gap-4 h-full">
                    <div className="block">
                       <KeyBadge musicalKey={song.key} size="lg" />
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-base truncate text-gray-900 dark:text-white mb-1">
                          {song.title}
                       </h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
                          {song.artist}
                          {/* Dot Separator */}
                          {song.sections?.length > 0 && (
                             <>
                               <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                               <span className="text-[10px] uppercase tracking-wide font-medium text-gray-400">
                                  {song.sections.length} seções
                               </span>
                             </>
                          )}
                       </p>
                    </div>

                    {/* Status Badge */}
                    <div className="hidden sm:flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                       <div className="flex flex-col items-end">
                          {song.sections?.length > 0 ? (
                             <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                                REGÊNCIA
                             </span>
                          ) : (
                             <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                RASCUNHO
                             </span>
                          )}
                       </div>
                    </div>
                 </Link>
                 
                 {/* Quick Actions Menu (Right - Always Visible with Large Hit Area) */}
                 <div className="pr-2 flex items-center gap-1 h-full">
                    <button 
                        onClick={() => navigate(`/band/${bandId}/songs/${song.id}`)}
                        className="min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg transition-colors touch-manipulation active:bg-gray-100"
                        title="Visualizar"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    
                    {canCreate && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); navigate(`/band/${bandId}/songs/${song.id}/edit`); }}
                                className="min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg transition-colors touch-manipulation active:bg-gray-100"
                                title="Editar"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                                onClick={(e) => handleDeleteClick(e, song)}
                                className="min-h-[48px] min-w-[48px] flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors touch-manipulation active:bg-gray-100"
                                title="Excluir"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                 </div>
               </motion.div>
             ))}
          </div>
        )}
      </main>

      {/* 4. Mobile FAB (Create) - Bigger Hit Area */}
      {canCreate && (
         <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/band/${bandId}/songs/create`)}
            className="fixed bottom-6 right-6 md:hidden w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/40 flex items-center justify-center z-40 touch-manipulation"
         >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
         </motion.button>
      )}

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen}
        title="Excluir Música"
        message={`Tem certeza que deseja excluir "${songToDelete?.title}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setIsDeleteModalOpen(false); setSongToDelete(null); }}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SongList;