import { Band } from './types';

export const isSubscriptionActive = (band: Band): boolean => {
  if (!band) return false;

  // 1. Check Status explicitly
  if (band.status === 'blocked' || band.status === 'expired') return false;
  if (band.status === 'active') return true;

  // 2. Check Trial
  if (band.status === 'trial') {
    const now = Date.now();
    return (band.trialEndsAt || 0) > now;
  }

  // 3. Fallback: Check active until date
  if (band.subscriptionActiveUntil) {
    return band.subscriptionActiveUntil > Date.now();
  }

  return false;
};

export const getSubscriptionState = (band: Band) => {
  const isActive = isSubscriptionActive(band);
  const now = Date.now();

  let daysRemaining = 0;
  if (band.status === 'trial' && band.trialEndsAt) {
    daysRemaining = Math.ceil((band.trialEndsAt - now) / (1000 * 60 * 60 * 24));
  } else if (band.subscriptionActiveUntil) {
    daysRemaining = Math.ceil((band.subscriptionActiveUntil - now) / (1000 * 60 * 60 * 24));
  }

  return {
    isActive,
    status: band.status,
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    isTrial: band.status === 'trial'
  };
};

export const getReadableStatus = (status: string | undefined): string => {
  switch (status) {
    case 'active': return 'Ativo';
    case 'trial': return 'Período de Teste';
    case 'expired': return 'Expirado';
    case 'blocked': return 'Bloqueado';
    case 'pending': return 'Pendente';
    default: return 'Desconhecido';
  }
};