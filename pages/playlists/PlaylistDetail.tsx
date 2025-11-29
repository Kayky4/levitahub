import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPlaylist, updatePlaylistOrder, deletePlaylist, canManagePlaylists, updatePlaylist } from '../../services/playlists';
import { getBandSongs } from '../../services/songs';
import { getBandMembers } from '../../services/bands';
import { Playlist, PlaylistSong, Song } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import { canControlRegency } from '../../services/regency';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

const PlaylistDetail: React.FC = () => {
  const { bandId, playlistId } = useParams<{ bandId: string; playlistId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [canRegent, setCanRegent] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Song Selection Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSongsToAdd, setSelectedSongsToAdd] = useState<string[]>([]);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // DnD State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!bandId || !playlistId || !user) return;

    const load = async () => {
      try {
        const [pl, allSongs, members] = await Promise.all([
          getPlaylist(bandId, playlistId),
          getBandSongs(bandId),
          getBandMembers(bandId)
        ]);
        
        setPlaylist(pl);
        setAvailableSongs(allSongs);

        const me = members.find(m => m.userId === user.uid);
        if (me) {
           setIsEditing(canManagePlaylists(me.role));
           setCanRegent(canControlRegency(me.role));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bandId, playlistId, user]);

  const handleAddSongs = async () => {
    if (!playlist || !bandId || !playlistId) return;

    const songsToAddDetails = availableSongs
      .filter(s => selectedSongsToAdd.includes(s.id))
      .map((s, idx) => ({
        songId: s.id,
        title: s.title,
        artist: s.artist,
        key: s.key,
        order: playlist.songs.length + idx
      }));

    const newSongsList = [...playlist.songs, ...songsToAddDetails];

    try {
      await updatePlaylistOrder(bandId, playlistId, newSongsList);
      setPlaylist({ ...playlist, songs: newSongsList });
      setShowAddModal(false);
      setSelectedSongsToAdd([]);
      showToast('Músicas adicionadas com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao adicionar músicas.', 'error');
    }
  };

  const handleRemoveSong = async (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation(); // Prevents triggering drag or other click events
    if (!playlist || !bandId || !playlistId) return;
    
    // We can keep window.confirm for simple item removal, or use a toast undo pattern in future
    if (!window.confirm('Remover música desta playlist?')) return;
    
    const newSongsList = playlist.songs.filter((_, idx) => idx !== indexToRemove);
    
    try {
      await updatePlaylistOrder(bandId, playlistId, newSongsList);
      setPlaylist({ ...playlist, songs: newSongsList });
      showToast('Música removida.', 'info');
    } catch (error) {
      showToast('Erro ao remover.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!playlist || !bandId || !playlistId) return;
    setIsDeleting(true);

    try {
      await deletePlaylist(bandId, playlistId);
      showToast('Playlist excluída com sucesso.', 'info');
      navigate(`/band/${bandId}/playlists`);
    } catch (error) {
      console.error(error);
      showToast('Erro ao excluir playlist.', 'error');
      setIsDeleting(false);
    }
  };

  const handleStartRegency = () => {
    navigate(`/band/${bandId}/regency/playlist/${playlistId}`);
  };

  // --- Drag and Drop Logic ---
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSongs = [...(playlist?.songs || [])];
    const draggedItem = newSongs[draggedIndex];
    newSongs.splice(draggedIndex, 1);
    newSongs.splice(index, 0, draggedItem);

    setPlaylist(prev => prev ? { ...prev, songs: newSongs } : null);
    setDraggedIndex(index);
  };

  const onDragEnd = async () => {
    setDraggedIndex(null);
    if (playlist && bandId && playlistId) {
      try {
        await updatePlaylistOrder(bandId, playlistId, playlist.songs);
      } catch (error) {
        console.error("Failed to save order", error);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando...</div>;
  if (!playlist) return <div className="p-10 text-center text-gray-500">Playlist não encontrada.</div>;

  const existingSongIds = new Set(playlist.songs.map(s => s.songId));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 pb-20 transition-colors duration-300">
      <div className="bg-white dark:bg-white/5 border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
           <div className="flex items-center">
            <button
              onClick={() => navigate(`/band/${bandId}/playlists`)}
              className="mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 min-w-[44px] min-h-[44px]"
            >
              &larr;
            </button>
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{playlist.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(playlist.date).toLocaleDateString()}</p>
              </div>
              {isEditing && (
                <button 
                  onClick={() => navigate(`/band/${bandId}/playlists/${playlistId}/edit`)}
                  className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-500/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Editar Detalhes"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            
            {canRegent && (
              <button 
                onClick={handleStartRegency}
                className="bg-red-600 text-white hover:bg-red-700 px-6 py-3 rounded-xl font-bold shadow-sm flex items-center min-h-[56px] touch-manipulation"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Iniciar Regência
              </button>
            )}

            {isEditing && (
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-3 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-colors min-h-[56px] touch-manipulation"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Songs List (Draggable) */}
        <div className="space-y-3">
          {playlist.songs.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
              <p className="text-gray-500 dark:text-gray-400">A lista está vazia.</p>
              {isEditing && (
                 <button 
                   onClick={() => setShowAddModal(true)}
                   className="mt-4 px-6 py-3 bg-purple-100 text-purple-700 rounded-lg font-bold hover:bg-purple-200 min-h-[48px]"
                 >
                   Adicionar músicas agora
                 </button>
              )}
            </div>
          )}

          {playlist.songs.map((song, index) => (
            <div
              key={`${song.songId}-${index}`}
              draggable={isEditing}
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={`
                bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between shadow-sm transition-colors min-h-[80px]
                ${draggedIndex === index ? 'opacity-50 border-purple-500 dark:border-purple-500 border-2' : ''}
              `}
            >
              <div className="flex items-center flex-1 overflow-hidden">
                {isEditing && (
                  <div className="mr-4 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </div>
                )}
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
                  {index + 1}
                </div>
                <Link to={`/band/${bandId}/songs/${song.songId}`} className="flex-1 min-w-0 group py-2 h-full flex flex-col justify-center">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{song.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{song.artist} • <span className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-1 rounded">{song.key}</span></p>
                </Link>
              </div>
              
              {isEditing && (
                <button
                  onClick={(e) => handleRemoveSong(e, index)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-4 p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
                  title="Remover da playlist"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="mt-8">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 dark:hover:text-purple-400 font-medium transition-colors hover:bg-purple-50 dark:hover:bg-purple-500/5 min-h-[64px] text-lg"
            >
              + Adicionar Músicas
            </button>
          </div>
        )}
      </main>

      {/* Add Songs Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-midnight-800 border border-gray-200 dark:border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Adicionar Músicas</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-2 min-w-[44px] min-h-[44px]">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {availableSongs.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">
                    Nenhuma música disponível no repertório.
                 </div>
              ) : (
                <div className="space-y-2">
                  {availableSongs.map(s => {
                    const isAlreadyIn = existingSongIds.has(s.id);
                    return (
                      <label 
                        key={s.id} 
                        className={`
                          flex items-center p-4 rounded-lg cursor-pointer border transition-colors min-h-[72px]
                          ${isAlreadyIn 
                             ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 opacity-60' 
                             : 'hover:bg-purple-50 dark:hover:bg-purple-500/10 border-transparent hover:border-purple-200 dark:hover:border-purple-500/30'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isAlreadyIn || selectedSongsToAdd.includes(s.id)}
                          disabled={isAlreadyIn}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSongsToAdd([...selectedSongsToAdd, s.id]);
                            } else {
                              setSelectedSongsToAdd(selectedSongsToAdd.filter(id => id !== s.id));
                            }
                          }}
                          className="h-6 w-6 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:bg-black/30 dark:border-white/20 min-w-[24px] min-h-[24px]"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                             <span className="block text-base font-medium text-gray-700 dark:text-gray-200">{s.title}</span>
                             {isAlreadyIn && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-500/20 px-1.5 py-0.5 rounded">ADICIONADA</span>}
                          </div>
                          <span className="block text-sm text-gray-500 dark:text-gray-400">{s.artist} • {s.key}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50 dark:bg-white/[0.02] rounded-b-xl">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors min-h-[56px]"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddSongs}
                disabled={selectedSongsToAdd.length === 0}
                className="px-6 py-3 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px] font-bold"
              >
                Adicionar {selectedSongsToAdd.length > 0 && `(${selectedSongsToAdd.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen}
        title="Excluir Playlist"
        message={`Tem certeza que deseja excluir a playlist "${playlist.title}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmLabel="Sim, Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PlaylistDetail;