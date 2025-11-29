import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserBands } from '../../services/bands';
import { UserProfile } from '../../services/types';
import BandCard from '../../components/dashboard/BandCard';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [myBands, setMyBands] = useState<UserProfile['bands']>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBands = async () => {
      try {
        const bands = await getUserBands();
        setMyBands(bands);
      } catch (error) {
        console.error("Error fetching bands", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchBands();
  }, [user]);

  const bandList = Object.entries(myBands || {}).map(([id, data]) => {
    const bandData = data as { name: string; role: string };
    return { 
      id, 
      name: bandData.name, 
      role: bandData.role 
    };
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const todayDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Contextual Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 first-letter:uppercase">
             {todayDate}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{user?.displayName?.split(' ')[0]}</span>.
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-lg">
             Aqui está o resumo dos seus ministérios e próximas escalas.
          </p>
        </div>

        <div className="flex gap-3">
           <Button 
             variant="ghost" 
             onClick={() => navigate('/band/join')}
             className="border border-gray-200 dark:border-white/10"
             leftIcon={<span>🔗</span>}
           >
             Entrar com Código
           </Button>
           <Button 
             variant="secondary" 
             onClick={() => navigate('/band/create')}
             leftIcon={<span>+</span>}
           >
             Nova Banda
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
           <Skeleton height="16rem" className="bg-gray-200 dark:bg-white/5 rounded-3xl" variant="rectangular" />
           <Skeleton height="16rem" className="bg-gray-200 dark:bg-white/5 rounded-3xl" variant="rectangular" />
           <Skeleton height="16rem" className="bg-gray-200 dark:bg-white/5 rounded-3xl" variant="rectangular" />
        </div>
      ) : (
        <>
          {bandList.length === 0 ? (
            <div className="py-10">
              <EmptyState 
                title="Você ainda não participa de nenhuma banda"
                description="Comece criando seu próprio ministério para organizar repertórios e escalas, ou peça o código de acesso para entrar em uma banda existente."
                actionLabel="Criar Minha Primeira Banda"
                onAction={() => navigate('/band/create')}
                icon={<span className="text-4xl">🎹</span>}
              />
            </div>
          ) : (
            <div>
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   Meus Ministérios
                   <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                     {bandList.length}
                   </span>
                 </h2>
               </div>
               
               <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                 {bandList.map((band, index) => (
                   <BandCard 
                     key={band.id}
                     id={band.id}
                     name={band.name}
                     role={band.role.toUpperCase()}
                     index={index}
                   />
                 ))}

                 {/* "Add New" Card Placeholder - Subtle CTA */}
                 <button
                   onClick={() => navigate('/band/create')}
                   className="group relative w-full min-h-[280px] rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 flex flex-col items-center justify-center text-center p-6 transition-all hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                 >
                    <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all mb-4">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Criar Outra Banda</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Gerencie múltiplos ministérios ou projetos paralelos.</p>
                 </button>
               </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;