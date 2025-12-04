import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../services/admin';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

const AdminUserList: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data.users);
            setLastDoc(data.lastDoc);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        try {
            const data = await getAllUsers(lastDoc);
            setUsers(prev => [...prev, ...data.users]);
            setLastDoc(data.lastDoc);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) return <div className="p-8"><Skeleton height="20rem" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Usuários ({users.length})</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Base de usuários cadastrados.</p>
                </div>
            </div>

            <GlassCard noPadding className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 dark:bg-white/5 text-xs uppercase text-gray-700 dark:text-gray-300 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4 text-center">Bandas (Participa)</th>
                                <th className="px-6 py-4 text-center">Bandas (Lidera)</th>
                                <th className="px-6 py-4">Criado em</th>
                                <th className="px-6 py-4">Último Acesso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {users.map((user) => {
                                const participatingCount = user.bands ? Object.keys(user.bands).length : 0;
                                const leadingCount = user.bands ? Object.values(user.bands).filter((b: any) => b.role === 'leader').length : 0;

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
                                                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {user.displayName || 'Sem Nome'}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-mono">{user.uid}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="neutral">{participatingCount}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={leadingCount > 0 ? 'purple' : 'neutral'}>{leadingCount}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                )
                            })}
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
        </div>
    );
};

export default AdminUserList;
