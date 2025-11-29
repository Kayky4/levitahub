import React from 'react';
import Modal from '../ui/Modal';
import { UserRole } from '../../services/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (role: UserRole) => void;
  currentRole: UserRole;
  isLoading?: boolean;
  memberName: string;
}

const ROLES: { id: UserRole; label: string; description: string; color: string }[] = [
  { 
    id: 'leader', 
    label: 'Líder', 
    description: 'Acesso total. Pode excluir a banda e gerenciar pagamentos.',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  { 
    id: 'vice', 
    label: 'Vice-Líder', 
    description: 'Pode gerenciar membros, músicas e playlists. Não pode excluir a banda.',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  { 
    id: 'regente', 
    label: 'Regente', 
    description: 'Pode criar músicas, playlists e controlar o Modo Ao Vivo. Não gere membros.',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  { 
    id: 'musico', 
    label: 'Músico', 
    description: 'Acesso de visualização. Pode ver músicas, playlists e receber regência.',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
];

const RolePickerModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, currentRole, isLoading, memberName }) => {
  const [selected, setSelected] = React.useState<UserRole>(currentRole);

  // Reset selected when modal opens
  React.useEffect(() => {
    if (isOpen) setSelected(currentRole);
  }, [isOpen, currentRole]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-midnight-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-200 dark:border-white/10">
          <div className="px-6 py-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Alterar Cargo de {memberName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Escolha o nível de permissão adequado.
            </p>

            <div className="space-y-3">
              {ROLES.map((role) => {
                const isSelected = selected === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelected(role.id)}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden
                      ${isSelected 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                        : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${role.color}`}>
                        {role.label.toUpperCase()}
                      </span>
                      {isSelected && (
                        <div className="h-5 w-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 px-6 py-4 flex flex-row-reverse gap-3">
            <button
              onClick={() => onConfirm(selected)}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Salvando...' : 'Confirmar Alteração'}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePickerModal;
