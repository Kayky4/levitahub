import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getBandDetails, getBandMembers, removeMember, canEditBand } from '../../services/bands';
import { getNextBandEvent } from '../../services/playlists';
import { subscribeToSession, canControlRegency } from '../../services/regency';
import { getBandSongs } from '../../services/songs';
import { Band, BandMember, UserRole, Playlist, RegencySession } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import RestrictionBanner from '../../components/billing/RestrictionBanner';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

// --- HELPER: Gradient Generator based on Band ID ---
const getBandGradient = (id: string) => {
  const gradients = [
    'from-indigo-600 via-purple-600 to-pink-500',
    'from-blue-600 via-cyan-500 to-teal-400',
    'from-emerald-600 via-green-500 to-lime-400',
    'from-rose-600 via-orange-500 to-amber-400',
    'from-violet-600 via-fuchsia-600 to-purple-500',
  ];
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
};

const BandDashboard: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Core Data
  const [band, setBand] = useState<Band | null>(null);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  // Smart Features Data
  const [nextEvent, setNextEvent] = useState<Playlist | null>(null);
  const [activeSession, setActiveSession] = useState<RegencySession | null>(null);
  const [songsCount, setSongsCount] = useState(0);

  // UI State
  const [loading, setLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!bandId || !user) return;

    const loadData = async () => {
      try {
        // 1. Fetch Static Data
        const [bandData, membersData, nextEventData, songsData] = await Promise.all([
          getBandDetails(bandId),
          getBandMembers(bandId),
          getNextBandEvent(bandId),
          getBandSongs(bandId)
        ]);

        setBand(bandData);
        setMembers(membersData);
        setNextEvent(nextEventData);
        setSongsCount(songsData.songs.length); // Fix: songsData returns { songs: [], lastDoc }

        // Billing Check
        const { isSubscriptionActive: checkActive } = await import('../../services/billing');
        const active = bandData ? checkActive(bandData) : false;
        setIsSubscriptionActive(active);

        const me = membersData.find(m => m.userId === user.uid);
        if (me) setCurrentUserRole(me.role);

        // 2. Subscribe to Realtime Session
        const unsubscribe = subscribeToSession(bandId, (session) => {
          setActiveSession(session);
        });

        return () => unsubscribe();

      } catch (error) {
        console.error("Error loading band data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bandId, user]);

  // Separate effect for subscription to ensure cleanup works correctly
  useEffect(() => {
    if (!bandId) return;
    const unsubscribe = subscribeToSession(bandId, (session) => {
      setActiveSession(session);
    });
    return () => unsubscribe();
  }, [bandId]);

  const handleCopyCode = () => {
    if (band?.code) {
      navigator.clipboard.writeText(band.code);
      showToast('Código copiado!', 'success');
    }
  };

  const handleShareWhatsApp = () => {
    if (band?.code) {
      const text = `Olá! Entre na banda "${band?.name}" no LevitaHub: *${band.code}*`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleLeaveBand = async () => {
    if (!bandId || !user) return;

    if (currentUserRole === 'leader' && members.length > 1) {
      alert('Líderes devem passar o bastão antes de sair.');
      setIsLeaveModalOpen(false);
      return;
    }

    setLeaving(true);
    try {
      await removeMember(bandId, user.uid);
      showToast('Você saiu da banda.', 'info');
      navigate('/dashboard');
    } catch (error) {
      showToast('Erro ao sair.', 'error');
      setLeaving(false);
    }
  };

  const handleEnterRegency = () => {
    if (!currentUserRole) return;

    if (canControlRegency(currentUserRole)) {
      // If session exists and has a playlist, link specifically to it to ensure context loading
      const targetPath = activeSession?.playlistId
        ? `/band/${bandId}/regency/playlist/${activeSession.playlistId}`
        : `/band/${bandId}/regency`;

      navigate(targetPath);
    } else {
      navigate(`/band/${bandId}/regency/view`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton height="12rem" className="rounded-3xl" variant="rectangular" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton height="10rem" className="rounded-3xl" variant="rectangular" />
          <Skeleton height="10rem" className="rounded-3xl" variant="rectangular" />
          <Skeleton height="10rem" className="rounded-3xl" variant="rectangular" />
        </div>
      </div>
    );
  }

  if (!band) return <div className="p-10 text-center dark:text-white">Banda não encontrada.</div>;

  const gradientClass = getBandGradient(band.id);
  const showSettings = currentUserRole && canEditBand(currentUserRole);
  const isPlus = isSubscriptionActive; // Simplified check

  // Date formatting for Next Event
  const nextEventDate = nextEvent ? new Date(nextEvent.date) : null;
  const daysToEvent = nextEventDate
    ? Math.ceil((nextEventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 pb-20 transition-colors duration-300">

      {bandId && <RestrictionBanner bandId={bandId} status={band.status} />}

      {/* 1. HEADER SECTION */}
      <div className="relative bg-white dark:bg-midnight-800 border-b border-gray-200 dark:border-white/5">
        {/* Decorative Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} opacity-10 dark:opacity-20`}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 md:pb-12">
          {/* Breadcrumb */}
          <Link to="/dashboard" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-wider mb-6 transition-colors p-3 -ml-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Voltar para Bandas
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                {/* Band Icon */}
                <div className={`h-20 w-20 md:h-24 md:w-24 rounded-3xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-2xl shadow-indigo-500/20 ring-4 ring-white dark:ring-white/5`}>
                  {band.name.charAt(0)}
                </div>

                <div>
                  <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                    {band.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {band.city && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {band.city}
                      </span>
                    )}
                    {band.style && (
                      <>
                        <span className="hidden md:inline w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                          {band.style}
                        </span>
                      </>
                    )}
                    {isPlus && (
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">
                        PLUS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Code Pill */}
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-3 min-h-[48px] bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full hover:border-indigo-300 dark:hover:border-white/30 transition-all group active:scale-95 touch-manipulation"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CÓDIGO</span>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{band.code}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>

              <div className="h-8 w-px bg-gray-300 dark:bg-white/20 hidden md:block mx-2"></div>

              <Button variant="ghost" onClick={handleShareWhatsApp} className="rounded-full w-12 h-12 p-0 flex items-center justify-center" title="WhatsApp">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              </Button>

              {showSettings && (
                <Button variant="ghost" onClick={() => navigate(`/band/${bandId}/edit`)} className="rounded-full w-12 h-12 p-0 flex items-center justify-center" title="Configurações">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </Button>
              )}

              <Button variant="danger" onClick={() => setIsLeaveModalOpen(true)} className="rounded-full w-12 h-12 p-0 flex items-center justify-center" title="Sair da Banda">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 pb-12">

        {/* HERO CARD: LIVE or NEXT EVENT */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {activeSession?.isActive ? (
              <motion.div
                key="live-hero"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                onClick={handleEnterRegency}
                className="cursor-pointer bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl p-1 shadow-2xl shadow-red-500/40 group transform hover:scale-[1.01] transition-transform"
              >
                <div className="bg-red-600 rounded-[20px] p-6 md:p-8 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  {/* Pulse Effect */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse-slow"></div>

                  <div className="flex items-center gap-5 relative z-10">
                    <div className="h-16 w-16 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <div className="flex space-x-1 items-end h-6">
                        <div className="w-1 bg-red-600 rounded-full animate-[bounce_1s_infinite] h-4"></div>
                        <div className="w-1 bg-red-600 rounded-full animate-[bounce_1.2s_infinite] h-6"></div>
                        <div className="w-1 bg-red-600 rounded-full animate-[bounce_0.8s_infinite] h-3"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="error" size="sm" className="bg-white text-red-600 border-none">AO VIVO</Badge>
                        <span className="text-red-100 text-xs font-bold uppercase tracking-wide">Sessão Iniciada</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white">Regência em Andamento</h2>
                      <p className="text-red-100 text-sm">Líder: {activeSession.leaderName}</p>
                    </div>
                  </div>

                  <button className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg group-hover:shadow-xl transition-all flex items-center gap-2 min-h-[56px]">
                    ENTRAR AGORA
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                </div>
              </motion.div>
            ) : nextEvent ? (
              <motion.div
                key="event-hero"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/band/${bandId}/playlists/${nextEvent.id}`)}
                className="cursor-pointer bg-white dark:bg-midnight-800 border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${gradientClass} opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3`}></div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex gap-5">
                    {/* Date Box */}
                    <div className="flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center bg-gray-100 dark:bg-white/5 rounded-2xl p-2 border border-gray-200 dark:border-white/5 min-h-[80px]">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                        {nextEventDate?.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-none my-1">
                        {nextEventDate?.getDate()}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {nextEventDate?.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                          Próximo Evento
                        </span>
                        {daysToEvent <= 1 && <span className="text-xs text-orange-500 font-bold">É Amanhã!</span>}
                        {daysToEvent === 0 && <span className="text-xs text-red-500 font-bold">É Hoje!</span>}
                      </div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {nextEvent.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        {nextEvent.songs.length} {nextEvent.songs.length === 1 ? 'música' : 'músicas'} no repertório
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                    {currentUserRole && canControlRegency(currentUserRole) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/band/${bandId}/regency/playlist/${nextEvent.id}`);
                        }}
                        className="w-full md:w-auto justify-center bg-red-500 hover:bg-red-600 border-red-400 text-white shadow-red-500/20 min-h-[56px]"
                        leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      >
                        Iniciar Regência
                      </Button>
                    )}
                    <Button variant="secondary" className="w-full md:w-auto justify-center group-hover:bg-indigo-50 dark:group-hover:bg-white/10 dark:group-hover:border-white/20 min-h-[56px]">
                      Ver Repertório
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-hero"
                className="bg-white/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-3xl p-8 text-center"
              >
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">Nenhum evento agendado.</p>
                <Button variant="outline" size="md" onClick={() => navigate(`/band/${bandId}/playlists/create`)}>
                  Agendar Culto ou Ensaio
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BENTO GRID ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* SONGS CARD */}
          <GlassCard
            hoverable
            onClick={() => navigate(`/band/${bandId}/songs`)}
            className="flex flex-col justify-between h-full group"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                </div>
                <span className="text-3xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform">{songsCount}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Músicas</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie o repertório da banda.</p>
            </div>
            {/* Always visible Action Link - No hover dependency */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center text-sm font-bold text-pink-600 dark:text-pink-400">
              Acessar Biblioteca &rarr;
            </div>
          </GlassCard>

          {/* PLAYLISTS CARD */}
          <GlassCard
            hoverable
            onClick={() => navigate(`/band/${bandId}/playlists`)}
            className="flex flex-col justify-between h-full group"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                {/* Can add stats here if needed */}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Playlists & Eventos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Organize a liturgia dos cultos.</p>
            </div>
            {/* Always visible Action Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center text-sm font-bold text-purple-600 dark:text-purple-400">
              Ver Agenda &rarr;
            </div>
          </GlassCard>

          {/* MEMBERS CARD - Different layout for Mobile/Desktop */}
          <GlassCard
            hoverable
            onClick={() => navigate(`/band/${bandId}/members`)}
            className="flex flex-col justify-between h-full group"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <span className="text-3xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform">{members.length}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Membros</h3>

              {/* Avatar Stack */}
              <div className="flex -space-x-3 overflow-hidden py-1">
                {members.slice(0, 5).map((m, i) => (
                  <div key={m.userId} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-midnight-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-white z-10 relative">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-midnight-800 bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 z-0">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </div>
            {/* Always visible Action Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400">
              Gerenciar Equipe &rarr;
            </div>
          </GlassCard>

        </div>

      </main>

      <Modal
        isOpen={isLeaveModalOpen}
        title="Sair da Banda"
        message={`Tem certeza que deseja sair de "${band.name}"? Você precisará de um novo código para entrar.`}
        variant="danger"
        confirmLabel="Sim, Sair"
        onConfirm={handleLeaveBand}
        onCancel={() => setIsLeaveModalOpen(false)}
        isLoading={leaving}
      />
    </div>
  );
};

export default BandDashboard;