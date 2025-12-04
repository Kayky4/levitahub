import React from 'react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface Props {
  code: string;
  bandName: string;
}

const InviteCard: React.FC<Props> = ({ code, bandName }) => {
  const { showToast } = useToast();

  const handleCopy = () => {
    // Copy only the part after the hyphen (e.g., "8H282T" from "BANDA-8H282T")
    const cleanCode = code.includes('-') ? code.split('-')[1] : code;
    navigator.clipboard.writeText(cleanCode);
    showToast('Código copiado!', 'success');
  };

  const handleWhatsApp = () => {
    const text = `Olá! Entre na banda "${bandName}" no LevitaHub usando o código: *${code}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <GlassCard className="mb-8 border-l-4 border-l-indigo-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z" /></svg>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-1.5 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </span>
            Convidar Novos Membros
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
            Compartilhe este código com sua equipe. Eles precisarão dele para entrar na banda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div
            onClick={handleCopy}
            className="group flex flex-col items-center justify-center bg-gray-100 dark:bg-black/30 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl px-6 py-2 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
          >
            <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-indigo-500">Código de Acesso</span>
            <span className="text-xl font-mono font-black text-gray-800 dark:text-white tracking-widest group-hover:scale-105 transition-transform">
              {code}
            </span>
          </div>

          <Button
            onClick={handleWhatsApp}
            className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-green-500/20"
            leftIcon={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
            }
          >
            Enviar no Zap
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default InviteCard;