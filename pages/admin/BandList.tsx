import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBands, extendTrial, updateBandStatus } from '../../services/admin';
import { Band } from '../../services/types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const AdminBandList: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [bands, setBands] = useState<Band[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Modal State
    const [selectedBand, setSelectedBand] = useState<Band | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadBands();
    }, []);

    const loadBands = async () => {
        try {
            const data = await getAllBands();
            setBands(data.bands);
            setLastDoc(data.lastDoc);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar bandas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        try {
            const data = await getAllBands(lastDoc);
            setBands(prev => [...prev, ...data.bands]);
            setLastDoc(data.lastDoc);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar mais bandas', 'error');
        } finally {
            setLoadingMore(false);
        }
    };

    const handleExtendTrial = async () => {
        if (!selectedBand) return;
        setActionLoading(true);
        try {
            await extendTrial(selectedBand.id, 30); // Add 30 days
            showToast('Trial estendido por 30 dias!', 'success');
            setIsModalOpen(false);
            loadBands(); // Refresh
        } catch (e) {
            showToast('Erro ao estender trial', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!selectedBand) return;
        setActionLoading(true);
        try {
            const newStatus = selectedBand.status === 'blocked' ? 'active' : 'blocked';
            await updateBandStatus(selectedBand.id, newStatus);
            showToast(`Banda ${newStatus === 'blocked' ? 'bloqueada' : 'desbloqueada'}!`, 'success');
            setIsModalOpen(false);
            loadBands();
        } catch (e) {
            showToast('Erro ao atualizar status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8"><Skeleton height="20rem" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Bandas ({bands.length})</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie todas as bandas cadastradas.</p>
                </div>
            </div>

            <GlassCard noPadding className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 dark:bg-white/5 text-xs uppercase text-gray-700 dark:text-gray-300 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Banda</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Cidade</th>
                                <th className="px-6 py-4">Criado em</th>
                                <th className="px-6 py-4">Vencimento</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {bands.map((band) => (
                                <tr key={band.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                {band.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{band.name}</p>
                                                <p className="text-xs text-gray-500">{band.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={
                                            band.status === 'active' ? 'success' :
                                                band.status === 'trial' ? 'info' :
                                                    band.status === 'blocked' ? 'error' : 'warning'
                                        }>
                                            {band.status?.toUpperCase() || 'N/A'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                        {band.city || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {band.createdAt ? new Date(band.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {band.subscriptionActiveUntil
                                            ? new Date(band.subscriptionActiveUntil).toLocaleDateString()
                                            : (band.trialEndsAt ? new Date(band.trialEndsAt).toLocaleDateString() : '-')}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                setSelectedBand(band);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            Gerenciar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => navigate(`/band/${band.id}/dashboard`)}
                                        >
                                            Ver &rarr;
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {lastDoc && (
                    <div className="p-4 border-t border-gray-200 dark:border-white/5 flex justify-center">
                        <Button variant="secondary" onClick={loadMore} isLoading={loadingMore}>
                            Carregar Mais
                        </Button>
                    </div>
                )}
            </GlassCard>

            {/* Management Modal */}
            {isModalOpen && selectedBand && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-midnight-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-white/10">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Gerenciar: {selectedBand.name}</h3>
                        <p className="text-sm text-gray-500 mb-6">ID: {selectedBand.id}</p>

                        <div className="space-y-3">
                            <Button
                                className="w-full justify-center"
                                onClick={handleExtendTrial}
                                isLoading={actionLoading}
                            >
                                🎁 Estender Trial (+30 dias)
                            </Button>

                            <Button
                                className={`w-full justify-center ${selectedBand.status === 'blocked' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                onClick={handleBlock}
                                isLoading={actionLoading}
                            >
                                {selectedBand.status === 'blocked' ? '✅ Desbloquear Banda' : '🚫 Bloquear Banda'}
                            </Button>

                            <div className="border-t border-gray-200 dark:border-white/10 my-4 pt-4">
                                <p className="text-xs text-gray-500 mb-2 text-center">Ações manuais de pagamento devem ser feitas na aba "Pagamentos".</p>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full justify-center"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBandList;
