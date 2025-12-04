import React, { useEffect, useState } from 'react';
import { getSupportTickets } from '../../services/admin';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

const AdminSupport: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getSupportTickets();
                setTickets(data);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Suporte ({tickets.length})</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciamento de tickets e ajuda.</p>
                </div>
            </div>

            <GlassCard noPadding className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 dark:bg-white/5 text-xs uppercase text-gray-700 dark:text-gray-300 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Assunto</th>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <Badge variant={ticket.status === 'open' ? 'warning' : 'success'}>
                                            {ticket.status === 'open' ? 'ABERTO' : 'RESOLVIDO'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                        {ticket.subject}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{ticket.user}</td>
                                    <td className="px-6 py-4 text-xs font-mono">
                                        {new Date(ticket.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button size="sm" variant="secondary" disabled={ticket.status === 'resolved'}>
                                            {ticket.status === 'resolved' ? 'Arquivado' : 'Responder'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default AdminSupport;
