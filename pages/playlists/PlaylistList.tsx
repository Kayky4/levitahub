import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBandPlaylists, canManagePlaylists } from '../../services/playlists';
import { getBandMembers, getBandDetails } from '../../services/bands';
import { Playlist } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const PlaylistList: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);

  useEffect(() => {
    if (!bandId || !user) return;

    const load = async () => {
      try {
        const [plData, membersData, bandData] = await Promise.all([
          getBandPlaylists(bandId),
          getBandMembers(bandId),
          getBandDetails(bandId)
        ]);
        setPlaylists(plData);

        // Billing Check
        const { isSubscriptionActive: checkActive } = await import('../../services/billing');
        const active = bandData ? checkActive(bandData) : false;
        setIsSubscriptionActive(active);

        const me = membersData.find(m => m.userId === user.uid);
        if (me) setCanCreate(canManagePlaylists(me.role));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bandId, user]);

  const isAllowed = isSubscriptionActive;
  const tooltip = !isAllowed ? "Assinatura necessária para criar playlists." : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 p-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          {[1, 2, 3].map(i => <Skeleton key={i} height="12rem" className="bg-gray-200 dark:bg-white/5" variant="rectangular" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 pb-20 transition-colors duration-300">
      <div className="bg-white/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate(`/band/${bandId}/dashboard`)} className="mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                &larr; Voltar
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Playlists e Eventos</h1>
            </div>
            {canCreate && (
              <div className="relative group">
                <Button
                  variant="primary"
                  disabled={!isAllowed}
                  onClick={() => navigate(`/band/${bandId}/playlists/create`)}
                  className="bg-purple-600 hover:bg-purple-700 border-purple-500/50 shadow-purple-500/20 text-white"
                  leftIcon={<span>+</span>}
                >
                  Nova Playlist
                </Button>
                {!isAllowed && (
                  <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-48 p-2 bg-black text-white text-xs rounded border border-white/10 z-30 shadow-xl">
                    {tooltip}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {playlists.length === 0 ? (
          <EmptyState
            title="Nenhuma Playlist"
            description="Crie playlists para organizar seus cultos, ensaios e apresentações."
            icon={<span className="text-3xl">📅</span>}
            actionLabel={canCreate && isAllowed ? "Criar Playlist" : undefined}
            onAction={() => navigate(`/band/${bandId}/playlists/create`)}
          />
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((pl) => (
              <GlassCard
                key={pl.id}
                hoverable
                onClick={() => navigate(`/band/${bandId}/playlists/${pl.id}`)}
                noPadding
                className="flex flex-col group"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded-lg px-3 py-1 text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                      {new Date(pl.date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                      {pl.songs.length} {pl.songs.length === 1 ? 'Música' : 'Músicas'}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    {pl.title}
                  </h3>
                  {pl.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {pl.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-600 italic">Sem descrição</p>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-white/5 px-6 py-3 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors uppercase tracking-wider">Abrir Playlist</span>
                  <span className="text-gray-400 group-hover:translate-x-1 transition-transform group-hover:text-purple-500 dark:group-hover:text-purple-400">→</span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PlaylistList;