import React, { useState, useRef, useEffect } from 'react';
import { BandMember, UserRole } from '../../services/types';
import Badge from '../ui/Badge';
import { canManageMembers } from '../../services/bands';

interface Props {
  member: BandMember;
  currentUserRole: UserRole | null;
  currentUserId: string;
  onEditRole: (member: BandMember) => void;
  onRemove: (member: BandMember) => void;
}

const MemberListItem: React.FC<Props> = ({ member, currentUserRole, currentUserId, onEditRole, onRemove }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMe = member.userId === currentUserId;
  const canEdit = currentUserRole && canManageMembers(currentUserRole, member.role) && !isMe;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Avatar colors based on role
  const getAvatarGradient = (role: UserRole) => {
    switch(role) {
      case 'leader': return 'from-yellow-400 to-orange-500 ring-yellow-200';
      case 'vice': return 'from-blue-400 to-indigo-500 ring-blue-200';
      case 'regente': return 'from-purple-400 to-fuchsia-500 ring-purple-200';
      default: return 'from-gray-300 to-gray-400 ring-gray-200 dark:from-gray-700 dark:to-gray-600 dark:ring-gray-700';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case 'leader': return 'LÍDER';
      case 'vice': return 'VICE-LÍDER';
      case 'regente': return 'REGENTE';
      default: return 'MÚSICO';
    }
  };

  return (
    <div className="group bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-indigo-200 dark:hover:border-white/10 hover:shadow-sm transition-all duration-200 min-h-[80px]">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarGradient(member.role)} flex items-center justify-center text-white font-bold text-lg shadow-sm ring-2 ring-offset-2 ring-offset-white dark:ring-offset-midnight-900 ${isMe ? 'ring-indigo-500' : ''}`}>
          {member.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              {member.name}
            </h3>
            {isMe && <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded">VOCÊ</span>}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-xs text-gray-500 dark:text-gray-400">{member.email}</span>
             {member.instrument && (
               <>
                 <span className="text-gray-300 dark:text-gray-600">•</span>
                 <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-1.5 rounded">
                   {member.instrument}
                 </span>
               </>
             )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="hidden sm:block">
           <Badge 
             variant={
               member.role === 'leader' ? 'warning' : 
               member.role === 'vice' ? 'info' :
               member.role === 'regente' ? 'purple' : 'neutral'
             }
           >
             {getRoleLabel(member.role)}
           </Badge>
        </div>

        {/* Actions Menu */}
        {canEdit ? (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation active:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 13a1 1 0 100-2 1 1 0 000 2zM12 7a1 1 0 100-2 1 1 0 000 2zM12 19a1 1 0 100-2 1 1 0 000 2z" /></svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-midnight-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-20 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={() => { onEditRole(member); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 transition-colors flex items-center gap-2 min-h-[48px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Alterar Cargo
                </button>
                <div className="border-t border-gray-100 dark:border-white/5 my-1"></div>
                <button 
                  onClick={() => { onRemove(member); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2 min-h-[48px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Remover Membro
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="sm:hidden">
             <Badge 
               size="sm"
               variant={
                 member.role === 'leader' ? 'warning' : 
                 member.role === 'vice' ? 'info' :
                 member.role === 'regente' ? 'purple' : 'neutral'
               }
             >
               {getRoleLabel(member.role)}
             </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberListItem;