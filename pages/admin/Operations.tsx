import React, { useEffect, useState } from 'react';
import { getOperationsStats } from '../../services/admin';
import GlassCard from '../../components/ui/GlassCard';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

const AdminOperations: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getOperationsStats();
                setStats(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="p-8"><Skeleton height="20rem" /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Monitoramento Operacional</h1>
                <p className="text-gray-600 dark:text-gray-400">Acompanhe a atividade em tempo real da plataforma.</p>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="relative overflow-hidden border-l-4 border-red-500">
                    <div className="absolute top-4 right-4 animate-pulse">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Regências Ativas</h3>
                    <div className="text-5xl font-black text-gray-900 dark:text-white">{stats.activeRegencies}</div>
                    <p className="text-sm text-gray-500 mt-2">Sessões ao vivo agora</p>
                </GlassCard>

                <GlassCard className="border-l-4 border-indigo-500">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sessões Hoje</h3>
                    <div className="text-5xl font-black text-gray-900 dark:text-white">{stats.sessionsToday}</div>
                    <p className="text-sm text-gray-500 mt-2">Cultos/Ensaios realizados</p>
                </GlassCard>

                <GlassCard className="border-l-4 border-green-500">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Músicos Online</h3>
                    <div className="text-5xl font-black text-gray-900 dark:text-white">{stats.musiciansOnline}</div>
                    <p className="text-sm text-gray-500 mt-2">Usuários conectados</p>
                </GlassCard>
            </div>

            {/* Activity Log */}
            <GlassCard>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Logs de Atividade Recente</h3>
                <div className="space-y-6">
                    {stats.recentLogs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-4 pb-6 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">
                            <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{log.action}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">na banda <span className="font-bold text-indigo-600 dark:text-indigo-400">{log.band}</span></p>
                            </div>
                            <span className="text-xs font-mono text-gray-400">{log.time}</span>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};

export default AdminOperations;
