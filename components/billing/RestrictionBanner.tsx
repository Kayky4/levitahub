import React from 'react';
import { SubscriptionStatus } from '../../services/types';
import { useNavigate } from 'react-router-dom';

interface Props {
  status: SubscriptionStatus | undefined;
  bandId: string;
}

const RestrictionBanner: React.FC<Props> = ({ status, bandId }) => {
  const navigate = useNavigate();

  if (!status || status === 'active' || status === 'trialing') return null;

  const goToBilling = () => navigate(`/band/${bandId}/billing`);

  if (status === 'inactive') {
    return (
      <div className="bg-indigo-600 text-white px-4 py-2 text-sm text-center cursor-pointer hover:bg-indigo-700" onClick={goToBilling}>
        <p className="font-medium">
          🎵 Modo Gratuito Limitado. <span className="underline">Ative o Plano Plus</span> para liberar regência e criar repertório ilimitado.
        </p>
      </div>
    );
  }

  if (status === 'past_due') {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-sm text-center cursor-pointer hover:bg-yellow-600" onClick={goToBilling}>
        <p className="font-bold">
          ⚠️ Pagamento Pendente. Sua assinatura está em período de graça. Regularize para evitar bloqueio.
        </p>
      </div>
    );
  }

  if (status === 'blocked' || status === 'canceled') {
    return (
      <div className="bg-red-600 text-white px-4 py-2 text-sm text-center cursor-pointer hover:bg-red-700" onClick={goToBilling}>
        <p className="font-bold">
          ⛔ Acesso Bloqueado. Sua assinatura expirou. Clique aqui para reativar.
        </p>
      </div>
    );
  }

  return null;
};

export default RestrictionBanner;
