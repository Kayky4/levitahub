import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlaylist, updatePlaylist, deletePlaylist, canManagePlaylists } from '../../services/playlists';
import { getBandMembers } from '../../services/bands';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const PlaylistEdit: React.FC = () => {
  const { bandId, playlistId } = useParams<{ bandId: string; playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!bandId || !playlistId || !user) return;

    const load = async () => {
      try {
        const [playlist, members] = await Promise.all([
          getPlaylist(bandId, playlistId),
          getBandMembers(bandId)
        ]);

        if (!playlist) {
          navigate(`/band/${bandId}/playlists`);
          return;
        }

        const me = members.find(m => m.userId === user.uid);
        if (!me || !canManagePlaylists(me.role)) {
          showToast('Você não tem permissão para editar playlists.', 'error');
          navigate(`/band/${bandId}/playlists/${playlistId}`);
          return;
        }

        setTitle(playlist.title);
        // Format ISO date to YYYY-MM-DD for input
        setDate(playlist.date.split('T')[0]);
        setDescription(playlist.description || '');

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bandId, playlistId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandId || !playlistId) return;
    setSaving(true);

    try {
      await updatePlaylist(bandId, playlistId, {
        title,
        date: new Date(date).toISOString(),
        description
      });
      showToast('Playlist atualizada com sucesso!', 'success');
      navigate(`/band/${bandId}/playlists/${playlistId}`);
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar playlist.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bandId || !playlistId) return;
    setDeleting(true);

    try {
      await deletePlaylist(bandId, playlistId);
      showToast('Playlist excluída.', 'info');
      navigate(`/band/${bandId}/playlists`);
    } catch (error) {
      console.error(error);
      showToast('Erro ao excluir playlist.', 'error');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 py-8 transition-colors duration-300">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Detalhes da Playlist</h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-midnight-800 p-6 shadow rounded-lg border border-gray-200 dark:border-white/10 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Evento</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 dark:border-white/10 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-black/20 text-gray-900 dark:text-white"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
            <input
              type="date"
              required
              className="mt-1 block w-full border border-gray-300 dark:border-white/10 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-black/20 text-gray-900 dark:text-white"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
            <textarea
              rows={3}
              className="mt-1 block w-full border border-gray-300 dark:border-white/10 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-black/20 text-gray-900 dark:text-white"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-white/5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              variant="primary"
            >
              Salvar Alterações
            </Button>
          </div>
        </form>

        <div className="mt-8 border border-red-200 dark:border-red-500/20 rounded-lg p-6 bg-red-50 dark:bg-red-500/5">
           <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Zona de Perigo</h3>
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Excluir esta playlist removerá permanentemente a lista de músicas associada a este evento.
           </p>
           <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
              Excluir Playlist
           </Button>
        </div>
      </div>

      <Modal 
        isOpen={isDeleteModalOpen}
        title="Excluir Playlist"
        message={`Tem certeza que deseja excluir "${title}"?`}
        variant="danger"
        confirmLabel="Sim, Excluir"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={deleting}
      />
    </div>
  );
};

export default PlaylistEdit;