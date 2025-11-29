import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBandBilling, createCheckoutSessionMock, runReconciliationJobMock, getBillingHistory, forceActivateSubscription } from '../../services/billing';
import { getBandDetails } from '../../services/bands';
import { BandBilling, BillingLog, Band } from '../../services/types';
import BillingStatusBadge from '../../components/billing/BillingStatusBadge';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const BillingDashboard: React.FC = () => {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();

  const [billing, setBilling] = useState<BandBilling | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const [history, setHistory] = useState<BillingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!bandId) return;
    loadData();
  }, [bandId]);

  const loadData = async () => {
    if (!bandId) return;
    setLoading(true);
    try {
      const [b, bl, h] = await Promise.all([
        getBandDetails(bandId),
        getBandBilling(bandId),
        getBillingHistory(bandId)
      ]);
      setBand(b);
      setBilling(bl);
      setHistory(h);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!bandId) return;
    setProcessing(true);
    try {
      const { url } = await createCheckoutSessionMock(bandId);
      window.location.href = `#${url}`; // Using hash router internally
    } catch (e) {
      alert("Erro ao iniciar checkout");
    } finally {
      setProcessing(false);
    }
  };

  const handleReconcile = async () => {
    if (!bandId) return;
    setProcessing(true);
    try {
      const msg = await runReconciliationJobMock(bandId);
      alert(msg);
      loadData(); // Refresh
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleForceActivate = async () => {
    if (!bandId) return;
    // Removido confirm nativo que as vezes bloqueia a UI em alguns navegadores/modos
    // if (!confirm("Isso ativará o plano imediatamente sem passar pelo checkout. Usar apenas para testes!")) return;
    
    setProcessing(true);
    try {
      console.log("Iniciando ativação forçada para banda:", bandId);
      await forceActivateSubscription(bandId);
      
      // Pequeno delay para garantir propagação no Firestore local
      setTimeout(async () => {
        await loadData();
        alert("Plano Plus ativado manualmente com sucesso!");
        setProcessing(false);
      }, 1000);
      
    } catch (e) {
      console.error("Erro na ativação manual:", e);
      alert("Erro ao ativar manualmente. Verifique o console.");
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-midnight-900 flex items-center justify-center text-gray-900 dark:text-white">Carregando faturamento...</div>;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Status Card */}
          <div className="md:col-span-2 space-y-6">
            <GlassCard className="relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                 <BillingStatusBadge status={billing?.subscriptionStatus || 'inactive'} />
              </div>

              <div className="pr-20">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plano Plus</h3>
                <p className="text-indigo-600 dark:text-indigo-300 font-medium">R$ 49,90 <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">/ mês</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Cobrado por banda. Membros ilimitados. Regência e Repertório liberados.
                </p>
              </div>
              
              <div className="mt-8 border-t border-gray-200 dark:border-white/10 pt-6">
                   {billing?.subscriptionStatus === 'trialing' && (
                     <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm flex items-center gap-3">
                       <span className="text-xl">⏳</span>
                       Você está no período de testes. Faltam <strong className="text-blue-900 dark:text-white">{billing.trialEndsAt ? Math.ceil((billing.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)) : 0} dias</strong>.
                     </div>
                   )}

                   {billing?.subscriptionStatus === 'past_due' && (
                     <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-800 dark:text-yellow-200 rounded-xl text-sm font-bold flex items-center gap-3">
                       <span className="text-xl">⚠️</span>
                       Pagamento falhou. Regularize agora para evitar bloqueio.
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-6 text-sm mb-8">
                     <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/5">
                       <span className="block text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Próxima renovação</span>
                       <span className="font-mono text-gray-900 dark:text-white text-lg">
                         {billing?.currentPeriodEnd 
                            ? new Date(billing.currentPeriodEnd).toLocaleDateString() 
                            : '-'}
                       </span>
                     </div>
                     <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-white/5">
                       <span className="block text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">ID da Assinatura</span>
                       <span className="font-mono text-gray-500 dark:text-gray-400 text-xs truncate block pt-1">
                         {billing?.stripeSubscriptionId || '-'}
                       </span>
                     </div>
                   </div>

                   <div className="flex gap-4">
                      {(!billing || billing.subscriptionStatus === 'inactive' || billing.subscriptionStatus === 'canceled' || billing.subscriptionStatus === 'blocked') ? (
                        <Button
                          onClick={handleActivate}
                          disabled={processing}
                          className="w-full md:w-auto"
                          size="lg"
                        >
                          {processing ? 'Processando...' : 'Ativar Plano Plus (14 dias grátis)'}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={handleActivate}
                          disabled={processing}
                          className="w-full md:w-auto"
                        >
                          Gerenciar Pagamento / Cartão
                        </Button>
                      )}
                   </div>
              </div>
            </GlassCard>

            {/* Mock Tools (Dev Only) */}
            <div className="bg-white dark:bg-black/30 border border-dashed border-gray-300 dark:border-white/10 rounded-xl p-6">
              <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wide mb-3">Ferramentas de Simulação (Admin/Dev)</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={handleReconcile}
                    disabled={processing}
                  >
                    Rodar Job de Reconciliação Diária
                  </Button>
                  <p className="text-xs text-gray-500">
                    Simula a passagem do tempo para expirar trials ou bloquear inadimplentes.
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t border-gray-100 dark:border-white/5 pt-4">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600 text-xs font-bold shadow-green-500/20"
                    size="sm"
                    onClick={handleForceActivate}
                    disabled={processing}
                  >
                    {processing ? 'Ativando...' : '⚡ Ativar Temporariamente o Plano Plus'}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Pula o checkout e ativa imediatamente (apenas para testes).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: History */}
          <div className="md:col-span-1">
            <GlassCard noPadding className="h-full flex flex-col">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Histórico
                </h3>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-white/5 overflow-y-auto flex-1 max-h-[500px] custom-scrollbar">
                {history.length === 0 ? (
                  <li className="p-6 text-sm text-gray-500 text-center">Nenhum evento registrado.</li>
                ) : (
                  history.map(log => (
                    <li key={log.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant="neutral" size="sm">
                           {log.type.split('.').pop()}
                        </Badge>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 break-all font-mono bg-gray-100 dark:bg-black/20 p-2 rounded border border-gray-200 dark:border-white/5">
                        {log.details}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </GlassCard>
          </div>

        </div>
      </main>
    </div>
  );
};

export default BillingDashboard;