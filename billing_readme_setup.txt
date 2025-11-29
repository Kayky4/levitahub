# Setup da Fase 5 - Billing (Mocked)

## Instalação
Não há dependências novas de NPM (como `stripe-js`) pois tudo é simulado.
Basta garantir que os arquivos foram criados corretamente.

## Configuração
1. Verifique se o arquivo `.env` possui as chaves MOCKED (veja `env.example.txt`).
2. Nenhuma configuração na Stripe Dashboard é necessária agora.

## Funcionamento
O sistema intercepta as chamadas de pagamento e as redireciona para `/mock-checkout`.
Ao "pagar", o frontend dispara uma função `processMockWebhook` que atualiza o Firestore exatamente como a Cloud Function faria.

## Limitações
- Não envia emails reais.
- Não valida cartão de crédito.
- As datas são geradas no cliente (timestamp).

## Para Produção
Quando for hora de lançar:
1. Crie uma conta Stripe.
2. Copie o código de `services/billing.ts` -> `processMockWebhook` para uma Cloud Function.
3. Instale `stripe` no backend.
4. Troque as chaves no `.env`.
