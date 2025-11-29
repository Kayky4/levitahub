# LevitaHub - Fase 2: Módulo de Bandas

## Objetivo
A Fase 2 focou na implementação da estrutura organizacional do sistema: Bandas e Membros.
Agora os usuários podem criar comunidades (ministérios), convidar membros via código e gerenciar hierarquias de permissão.

## Arquitetura Adicionada

### Firestore
- Nova coleção `bands` na raiz.
- Subcoleção `members` dentro de cada banda.
- Denormalização de dados no perfil do usuário (`users/{uid}.bands`) para evitar leituras excessivas na Dashboard inicial.

### Services (`src/services/bands.ts`)
Centraliza toda a lógica de escrita no banco. Utiliza `writeBatch` para garantir atomicidade nas operações que envolvem múltiplas coleções (ex: entrar na banda atualiza a banda, o membro e o perfil do usuário simultaneamente).

### Segurança
- Implementação de Regras de Segurança (Firestore Rules) para garantir que apenas membros acessem os dados da banda.
- Lógica de "Poder" no frontend (`canManageMembers`) para exibir/ocultar botões de administração.

## Telas Implementadas
1. **Create Band**: Formulário simples para iniciar um grupo.
2. **Join Band**: Entrada via Código único (ex: BANDA-X92Z).
3. **Band Dashboard**: Visão geral com atalhos (alguns bloqueados para fases futuras) e lista rápida de membros.
4. **Member Management**: Lista detalhada onde Líderes e Vices podem promover, rebaixar ou remover integrantes.

## Como Testar
Siga o checklist no arquivo `BAND_MODULE_TESTS.txt`.
Recomendado usar dois navegadores (ou aba anônima) para simular dois usuários diferentes (Líder e Músico) interagindo.

## Próximos Passos (Fase 3)
- Implementação do módulo de Músicas e Cifras.
- Criação de Playlists.
- Editor de texto para cifras.
- Integração Stripe (preparação).

## Próximos Passos (Fase 4)
- Modo Regência (WebSockets/Realtime).
- Sincronização de rolagem de tela.
