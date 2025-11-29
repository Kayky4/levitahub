import React from 'react';
import { SubscriptionStatus } from '../../services/types';
import { getReadableStatus } from '../../services/billing';

interface Props {
  status: SubscriptionStatus;
}

const BillingStatusBadge: React.FC<Props> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';

  switch (status) {
    case 'active':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'trialing':
      colorClass = 'bg-blue-100 text-blue-800 border border-blue-200';
      break;
    case 'past_due':
      colorClass = 'bg-yellow-100 text-yellow-800 animate-pulse';
      break;
    case 'canceled':
    case 'blocked':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'inactive':
      colorClass = 'bg-gray-200 text-gray-600';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {getReadableStatus(status)}
    </span>
  );
};

export default BillingStatusBadge;
