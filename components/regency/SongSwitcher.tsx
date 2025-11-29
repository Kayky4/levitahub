import React from 'react';
import { PlaylistSong } from '../../services/types';

interface Props {
  songs: PlaylistSong[];
  currentSongId: string | null;
  onSelect: (songId: string) => void;
}

const SongSwitcher: React.FC<Props> = ({ songs, currentSongId, onSelect }) => {
  const currentIndex = songs.findIndex(s => s.songId === currentSongId);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelect(songs[currentIndex - 1].songId);
    }
  };

  const handleNext = () => {
    if (currentIndex < songs.length - 1) {
      onSelect(songs[currentIndex + 1].songId);
    }
  };

  if (songs.length === 0) {
    return <div className="text-gray-500 text-sm">Sem músicas na playlist.</div>;
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
        >
          &larr; Anterior
        </button>
        
        <div className="flex-1 mx-4">
          <select
            value={currentSongId || ''}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Selecione uma música...</option>
            {songs.map(s => (
              <option key={s.songId} value={s.songId}>
                {s.order + 1}. {s.title} ({s.key})
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleNext}
          disabled={currentIndex === -1 || currentIndex >= songs.length - 1}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-30 disabled:bg-gray-700"
        >
          Próxima &rarr;
        </button>
      </div>
      {currentSongId && currentIndex !== -1 && (
        <div className="text-center text-xs text-gray-400">
          Música {currentIndex + 1} de {songs.length} • {songs[currentIndex].artist}
        </div>
      )}
    </div>
  );
};

export default SongSwitcher;
