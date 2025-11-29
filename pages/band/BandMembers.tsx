import React, { useEffect, useState, useMemo } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { getBandMembers, updateMemberRole, removeMember, getBandDetails } from '../../services/bands';
import { BandMember, UserRole, Band } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import InviteCard from '../../components/band/InviteCard';
import MemberListItem from '../../components/band/MemberListItem';
import RolePickerModal from '../../components/band/RolePickerModal';

const BandMembers: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Data State
  const [band, setBand] = useState<Band | null>(null);
  const [members, setMembers] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'leaders' | 'musicians'>('all');

  // Actions State
  const [memberToEdit, setMemberToEdit] = useState<BandMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<BandMember | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!bandId || !user) return;
    const loadData = async () => {
      try {
        const [bandData, membersData] = await Promise.all([
          getBandDetails(bandId),
          getBandMembers(bandId)
        ]);
        setBand(bandData);
        setMembers(membersData);

        const myMember = membersData.find(m => m.userId === user.uid);
        if (myMember) setCurrentUserRole(myMember.role);
      } catch (error) {
        console.error("Error loading members", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bandId, user]);

  // Derived State
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.instrument?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' 
        ? true 
        : roleFilter === 'leaders' 
          ? ['leader', 'vice'].includes(m.role)
          : ['regente', 'musico'].includes(m.role);

      return matchesSearch && matchesRole;
    }).sort((a, b) => {
        // Sort Leaders first
        const score = (r: UserRole) => ({ leader: 3, vice: 2, regente: 1, musico: 0 }[r]);
        return score(b.role) - score(a.role);
    });
  }, [members, searchTerm, roleFilter]);

  // Handlers
  const handleRoleUpdate = async (newRole: UserRole) => {
    if (!bandId || !memberToEdit) return;
    setIsProcessing(true);
    try {
      await updateMemberRole(bandId, memberToEdit.userId, newRole);
      setMembers(prev => prev.map(m => m.userId === memberToEdit.userId ? { ...m, role: newRole } : m));
      showToast(`Cargo de ${memberToEdit.name} alterado com sucesso!`, 'success');
      setMemberToEdit(null);
    } catch (error) {
      showToast('Erro ao atualizar cargo.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!bandId || !memberToRemove) return;
    setIsProcessing(true);
    try {
      await removeMember(bandId, memberToRemove.userId);
      setMembers(prev => prev.filter(m => m.userId !== memberToRemove.userId));
      showToast(`${memberToRemove.name} removido da banda.`, 'info');
      setMemberToRemove(null);
    } catch (error) {
      showToast('Erro ao remover membro.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
       <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 p-8 pt-24 space-y-4 max-w-5xl mx-auto">
         <Skeleton height="8rem" className="rounded-2xl" />
         {[1,2,3].map(i => <Skeleton key={i} height="5rem" className="rounded-xl" variant="rectangular" />)}
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 pb-20 transition-colors duration-300">
      
      {/* Sticky Header */}
      <div className="bg-white/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate(`/band/${bandId}/dashboard`)} className="p-2 -ml-2">
                &larr;
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Equipe</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{band?.name} • {members.length} membros</p>
              </div>
            </div>
            {/* Optional Right Action if needed */}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Invite Card */}
        {band && <InviteCard code={band.code} bandName={band.name} />}

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
           <div className="flex-1 relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <input
               type="text"
               placeholder="Buscar por nome, email ou instrumento..."
               className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-white/10 rounded-xl leading-5 bg-white dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           <div className="flex gap-2 p-1 bg-gray-100 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5 overflow-x-auto shrink-0">
              <button 
                onClick={() => setRoleFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${roleFilter === 'all' ? 'bg-white dark:bg-white/10 shadow text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setRoleFilter('leaders')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${roleFilter === 'leaders' ? 'bg-white dark:bg-white/10 shadow text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Liderança
              </button>
              <button 
                onClick={() => setRoleFilter('musicians')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${roleFilter === 'musicians' ? 'bg-white dark:bg-white/10 shadow text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Músicos
              </button>
           </div>
        </div>

        {/* Members List Grid */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
             <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400">Nenhum membro encontrado com os filtros atuais.</p>
             </div>
          ) : (
            filteredMembers.map((member) => (
              <MemberListItem 
                key={member.userId}
                member={member}
                currentUserId={user!.uid}
                currentUserRole={currentUserRole}
                onEditRole={(m) => setMemberToEdit(m)}
                onRemove={(m) => setMemberToRemove(m)}
              />
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      {memberToEdit && (
        <RolePickerModal 
          isOpen={!!memberToEdit}
          onClose={() => setMemberToEdit(null)}
          onConfirm={handleRoleUpdate}
          currentRole={memberToEdit.role}
          memberName={memberToEdit.name}
          isLoading={isProcessing}
        />
      )}

      <Modal 
        isOpen={!!memberToRemove}
        title="Remover Membro"
        message={`Tem certeza que deseja remover ${memberToRemove?.name} da banda? Ele perderá acesso imediato.`}
        variant="danger"
        confirmLabel="Remover"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setMemberToRemove(null)}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default BandMembers;