import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { processMockWebhook } from '../../services/billing';

const MockCheckout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const bandId = searchParams.get('band_id');

  const [processing, setProcessing] = useState(false);

  if (!sessionId || !bandId) return <div className="p-10">Invalid Session</div>;

  const handlePayment = async (success: boolean) => {
    setProcessing(true);
    
    // Determine event type based on simulation button
    const eventType = success ? 'checkout.session.completed' : 'invoice.payment_failed';
    
    // Simulate Webhook call
    const mockEvent = {
      id: `evt_${Math.random().toString(36).substr(2, 10)}`,
      type: eventType,
      created: Date.now() / 1000,
      data: {
        object: {
           id: sessionId,
           subscription: "sub_mock_123",
           customer: "cus_mock_123"
        }
      }
    };

    try {
      await processMockWebhook(bandId, mockEvent as any);
      
      if (success) {
        alert("Pagamento Aprovado! (Simulado)");
        navigate(`/band/${bandId}/billing`);
      } else {
        alert("Pagamento Recusado! (Simulado)");
        navigate(`/band/${bandId}/billing`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar webhook simulado");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border-t-8 border-indigo-600">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Checkout Simulado</h2>
          <p className="text-sm text-gray-500">Ambiente de Testes (Sem cobrança real)</p>
        </div>

        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700">Produto</span>
            <span>Plano Plus</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700">Preço</span>
            <span>R$ 49,90 / mês</span>
          </div>
          <div className="flex justify-between items-center text-green-600 font-bold">
            <span>Trial</span>
            <span>14 dias grátis</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => handlePayment(true)}
            disabled={processing}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow transition-all"
          >
            {processing ? 'Processando...' : '✅ Simular Pagamento Aprovado'}
          </button>
          
          <button 
            onClick={() => handlePayment(false)}
            disabled={processing}
            className="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded shadow transition-all"
          >
             {processing ? 'Processando...' : '❌ Simular Falha no Cartão'}
          </button>

          <button 
            onClick={() => navigate(-1)}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancelar
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-400 text-center">
          Session ID: {sessionId}
        </div>
      </div>
    </div>
  );
};

export default MockCheckout;
