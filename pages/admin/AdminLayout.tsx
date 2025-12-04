import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../services/admin';

const AdminLayout: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (!loading) {
            if (!user || !isAdmin(user.email)) {
                navigate('/dashboard');
            }
        }
    }, [user, loading, navigate]);

    if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex items-center justify-center text-gray-900 dark:text-white">Carregando...</div>;

    const menuItems = [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Bandas', path: '/admin/bands' },
        { label: 'Usuários', path: '/admin/users' },
        { label: 'Pagamentos', path: '/admin/payments' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 text-gray-900 dark:text-white flex transition-colors duration-300 font-sans">
            {/* Sidebar - Fixed */}
            <aside className="w-64 h-screen sticky top-0 border-r border-gray-200 dark:border-white/10 flex flex-col bg-white dark:bg-midnight-900 transition-colors duration-300 z-50">
                <div className="p-6">
                    <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        LevitaHub <span className="text-gray-500 dark:text-white/50 text-xs block font-mono mt-1 font-bold">ADMIN PANEL</span>
                    </h1>
                </div>

                <nav className="space-y-1 flex-1 px-4 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/10">
                        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operações</p>
                        <button
                            onClick={() => navigate('/admin/operations')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${location.pathname === '/admin/operations'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                        >
                            Monitoramento
                        </button>
                        <button
                            onClick={() => navigate('/admin/support')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${location.pathname === '/admin/support'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`}
                        >
                            Suporte
                        </button>
                    </div>
                </nav>

                <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{user?.displayName || 'Admin'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 w-full py-2 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-white dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-all shadow-sm"
                    >
                        Voltar ao App
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen bg-gray-50 dark:bg-midnight-900 p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
