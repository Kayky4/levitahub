import React, { useEffect, useState } from 'react';
import { getDetailedDashboardStats } from '../../services/admin';
import GlassCard from '../../components/ui/GlassCard';
import Skeleton from '../../components/ui/Skeleton';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getDetailedDashboardStats();
                setStats(data);
            } catch (error) {
                console.error(error);
                setError('Falha ao carregar dados. Verifique suas permissões.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} height="8rem" className="rounded-2xl" />
                ))}
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error || 'Erro desconhecido ao carregar dados.'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Visão Geral</h1>
                <p className="text-gray-600 dark:text-gray-400">Acompanhe o crescimento e a saúde do LevitaHub.</p>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard className="flex flex-col justify-between h-32 border-l-4 border-indigo-500">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total de Bandas</span>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalBands}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-500/10 px-2 py-1 rounded-full">+12%</span>
                    </div>
                </GlassCard>

                <GlassCard className="flex flex-col justify-between h-32 border-l-4 border-blue-500">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Em Trial</span>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.trialBands}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Potenciais assinantes</span>
                    </div>
                </GlassCard>

                <GlassCard className="flex flex-col justify-between h-32 border-l-4 border-green-500">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ativas (Pagas)</span>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.activeBands}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Receita recorrente</span>
                    </div>
                </GlassCard>

                <GlassCard className="flex flex-col justify-between h-32 border-l-4 border-red-500">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bloqueadas/Exp.</span>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.blockedBands}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Necessitam atenção</span>
                    </div>
                </GlassCard>
            </div>

            {/* Revenue Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <h2 className="text-indigo-100 font-bold text-sm uppercase tracking-wider mb-1">Faturamento (Mês Atual)</h2>
                            <div className="text-5xl font-black mb-6">
                                R$ {stats.monthlyRevenue?.toFixed(2).replace('.', ',') || '0,00'}
                            </div>

                            <div className="flex gap-8">
                                <div>
                                    <span className="block text-indigo-200 text-xs font-bold uppercase">Acumulado Total</span>
                                    <span className="text-2xl font-bold">R$ {stats.totalRevenue?.toFixed(2).replace('.', ',') || '0,00'}</span>
                                </div>
                                <div>
                                    <span className="block text-indigo-200 text-xs font-bold uppercase">Ticket Médio</span>
                                    <span className="text-2xl font-bold">R$ 49,90</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4">
                            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">💰</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
