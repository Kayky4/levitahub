import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSong, canEditMusic } from '../../services/songs';
import { getBandMembers } from '../../services/bands';
import { getBandPlaylists, updatePlaylistOrder, getPlaylist } from '../../services/playlists';
import { Song, Playlist } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';

const SongView: React.FC = () => {
  const { bandId, songId } = useParams<{ bandId: string; songId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  // Add to Playlist State
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  useEffect(() => {
    if (!bandId || !songId || !user) return;

    const load = async () => {
      try {
        const [songData, membersData] = await Promise.all([
          getSong(bandId, songId),
          getBandMembers(bandId)
        ]);
        setSong(songData);

        const me = membersData.find(m => m.userId === user.uid);
        if (me) setCanEdit(canEditMusic(me.role));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bandId, songId, user]);

  const handleOpenPlaylistModal = async () => {
    if (!bandId) return;
    setShowPlaylistModal(true);
    setLoadingPlaylists(true);
    try {
      const plData = await getBandPlaylists(bandId);
      // Filter only upcoming playlists or just show all sorted by date
      setPlaylists(plData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!bandId || !song || !playlistId) return;
    
    try {
      // 1. Get current playlist state to find correct order index
      const targetPlaylist = await getPlaylist(bandId, playlistId);
      if (!targetPlaylist) throw new Error('Playlist not found');

      // 2. Create new song entry
      const newSongEntry = {
        songId: song.id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        order: targetPlaylist.songs.length
      };

      // 3. Append and Update
      const newSongsList = [...targetPlaylist.songs, newSongEntry];
      await updatePlaylistOrder(bandId, playlistId, newSongsList);
      
      alert(`Adicionada à playlist "${targetPlaylist.title}" com sucesso!`);
      setShowPlaylistModal(false);
    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar à playlist.');
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  if (!song) return <div className="p-10 text-center">Música não encontrada.</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/band/${bandId}/songs`)}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              &larr;
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{song.title}</h1>
              <p className="text-sm text-gray-500">{song.artist} • Tom: {song.key}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button 
                onClick={handleOpenPlaylistModal}
                className="text-gray-700 hover:text-pink-600 bg-gray-100 hover:bg-pink-50 px-3 py-1 border border-gray-300 rounded text-sm font-medium transition-colors"
              >
                + Playlist
              </button>
            )}
            
            {canEdit && (
              <Link
                to={`/band/${bandId}/songs/${songId}/edit`}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-pink-600 hover:bg-pink-700"
              >
                Editar
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {song.sections.map((section) => (
            <div key={section.id} className="group">
              <h3 className="text-sm font-bold text-pink-600 uppercase tracking-wider mb-2 border-b border-pink-100 pb-1">
                {section.name}
              </h3>
              <div className="whitespace-pre-wrap font-mono text-gray-800 text-lg leading-relaxed">
                {section.content}
              </div>
              {section.cues && (
                 <div className="mt-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded inline-block">
                   💡 {section.cues}
                 </div>
              )}
            </div>
          ))}
          
          {song.sections.length === 0 && (
             <div className="whitespace-pre-wrap font-mono text-gray-800 text-lg leading-relaxed">
                {song.content}
             </div>
          )}
        </div>
      </main>

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Adicionar à Playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {loadingPlaylists ? (
                <div className="text-center py-4">Carregando playlists...</div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma playlist encontrada.
                  <br />
                  <Link to={`/band/${bandId}/playlists/create`} className="text-pink-600 underline">Criar uma agora</Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {playlists.map(pl => (
                    <li key={pl.id}>
                      <button
                        onClick={() => handleAddToPlaylist(pl.id)}
                        className="w-full text-left py-3 px-2 hover:bg-gray-50 rounded flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-pink-600">{pl.title}</p>
                          <p className="text-xs text-gray-500">{new Date(pl.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-pink-600">+</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setShowPlaylistModal(false)}
                className="w-full py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongView;