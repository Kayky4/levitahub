import React, { useEffect, useState } from 'react';
import { getAllPayments, registerManualPayment } from '../../services/admin';
import { ManualPayment } from '../../services/types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

const AdminPaymentList: React.FC = () => {
    const { showToast } = useToast();
    const [payments, setPayments] = useState<ManualPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPayment, setNewPayment] = useState({ bandId: '', amount: 49.90, method: 'pix', months: 1 });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const data = await getAllPayments();
            setPayments(data.payments);
            setLastDoc(data.lastDoc);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar pagamentos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        try {
            const data = await getAllPayments(lastDoc);
            setPayments(prev => [...prev, ...data.payments]);
            setLastDoc(data.lastDoc);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar mais pagamentos', 'error');
        } finally {
            setLoadingMore(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await registerManualPayment(newPayment.bandId, newPayment.amount, newPayment.method, newPayment.months);
            showToast('Pagamento registrado com sucesso!', 'success');
            setIsModalOpen(false);
            setNewPayment({ bandId: '', amount: 49.90, method: 'pix', months: 1 });
            loadPayments();
        } catch (error) {
            showToast('Erro ao registrar pagamento. Verifique o ID da banda.', 'error');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8"><Skeleton height="20rem" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Pagamentos Manuais ({payments.length})</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Histórico de pagamentos via PIX/Transferência.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    + Registrar Pagamento
                </Button>
            </div>

            <GlassCard noPadding className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 dark:bg-white/5 text-xs uppercase text-gray-700 dark:text-gray-300 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Banda ID</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Método</th>
                                <th className="px-6 py-4">Aprovado Por</th>
                                <th className="px-6 py-4">Mês Ref.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {new Date(payment.approvedAt).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(payment.approvedAt).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400">{payment.bandId}</td>
                                    <td className="px-6 py-4 font-black text-green-600 dark:text-green-400 text-base">
                                        R$ {payment.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="neutral">{payment.method}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{payment.approvedBy}</td>
                                    <td className="px-6 py-4 font-mono">{payment.referenceMonth}</td>
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

            {/* Register Payment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-midnight-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-white/10">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Registrar Pagamento</h3>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID da Banda</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newPayment.bandId}
                                    onChange={e => setNewPayment({ ...newPayment, bandId: e.target.value })}
                                    placeholder="Cole o ID da banda aqui"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newPayment.amount}
                                        onChange={e => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meses</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        required
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newPayment.months}
                                        onChange={e => setNewPayment({ ...newPayment, months: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newPayment.method}
                                    onChange={e => setNewPayment({ ...newPayment, method: e.target.value })}
                                >
                                    <option value="pix">PIX</option>
                                    <option value="transferencia">Transferência</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1 justify-center"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 justify-center bg-green-600 hover:bg-green-700 text-white"
                                    isLoading={submitting}
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentList;
