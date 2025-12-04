import React, { useEffect, useState } from 'react';
// @ts-ignore
import { useParams, useNavigate } from 'react-router-dom';
import { getBandDetails } from '../../services/bands';
import { getSubscriptionState, getReadableStatus } from '../../services/billing';
import { Band } from '../../services/types';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const BillingDashboard: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();

  const [band, setBand] = useState<Band | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bandId) return;
    loadData();
  }, [bandId]);

  const loadData = async () => {
    if (!bandId) return;
    setLoading(true);
    try {
      const bandData = await getBandDetails(bandId);
      setBand(bandData);

      if (bandData) {
        const state = getSubscriptionState(bandData);
        setSubscriptionState(state);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex items-center justify-center text-gray-900 dark:text-white">Carregando faturamento...</div>;

  if (!band || !subscriptionState) return <div className="p-10 text-center">Banda não encontrada.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 pb-12 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate(`/band/${bandId}/dashboard`)} className="mr-4 text-gray-500 dark:text-gray-400">
              &larr; Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assinatura da Banda</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Status Card */}
          <div className="space-y-6">
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <Badge variant={subscriptionState.isActive ? 'success' : 'error'}>
                  {getReadableStatus(subscriptionState.status)}
                </Badge>
              </div>

              <div className="pr-20">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plano LevitaHub Plus</h3>
                <p className="text-indigo-600 dark:text-indigo-300 font-medium">R$ 49,90 <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">/ mês</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Cobrado por banda. Membros ilimitados. Regência e Repertório liberados.
                </p>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-white/10 pt-6">
                {subscriptionState.isTrial && (
                  <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm flex items-center gap-3">
                    <span className="text-xl">⏳</span>
                    Você está no período de testes. Faltam <strong className="text-blue-900 dark:text-white">{subscriptionState.daysRemaining} dias</strong>.
                  </div>
                )}

                {!subscriptionState.isActive && !subscriptionState.isTrial && (
                  <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-200 rounded-xl text-sm font-bold flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    Sua assinatura expirou. Renove para continuar usando os recursos premium.
                  </div>
                )}

                <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/5 mb-6">
                  <span className="block text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Vencimento</span>
                  <span className="font-mono text-gray-900 dark:text-white text-lg">
                    {band.subscriptionActiveUntil
                      ? new Date(band.subscriptionActiveUntil).toLocaleDateString()
                      : (band.trialEndsAt ? new Date(band.trialEndsAt).toLocaleDateString() : '-')}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Payment Instructions (Manual) */}
          <div>
            <GlassCard>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Como Renovar?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                No momento, operamos com pagamentos via PIX. Para renovar sua assinatura, faça uma transferência e envie o comprovante para nosso suporte.
              </p>

              <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10 mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Chave PIX (CNPJ)</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono font-bold text-gray-900 dark:text-white">00.000.000/0001-00</code>
                  <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText('00.000.000/0001-00')}>Copiar</Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">LevitaHub Tecnologia LTDA</p>
              </div>

              <Button
                className="w-full justify-center bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open('https://wa.me/5511999999999?text=Olá, gostaria de renovar a assinatura da banda ' + band.name, '_blank')}
              >
                Enviar Comprovante no WhatsApp
              </Button>
            </GlassCard>
          </div>

        </div>
      </main>
    </div>
  );
};

export default BillingDashboard;