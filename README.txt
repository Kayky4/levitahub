# LevitaHub - MVP Fase 1

## Visão Geral
O LevitaHub é um Micro SaaS para gestão de bandas e ministérios de louvor, focado em sincronização em tempo real (Modo Regência).
Esta é a Fase 1 do desenvolvimento, focada exclusivamente na fundação arquitetural, configuração de ambiente e autenticação.

## Tecnologias
- React 18
- TypeScript
- Vite
- TailwindCSS
- Firebase (Auth, Firestore, Storage)
- React Router DOM (v6)

## Como Instalar

1. Clone o repositório.
2. Certifique-se de ter o Node.js instalado.
3. Instale as dependências:
   npm install

## Como Configurar .env

1. Crie um arquivo chamado `.env` na raiz do projeto.
2. Copie o conteúdo de `env.example.txt`.
3. Preencha as variáveis com as chaves do seu projeto Firebase.
   Nota: O código já vem pré-configurado com as chaves públicas fornecidas no desafio, mas é boa prática ter o arquivo .env.

## Como Rodar

Para iniciar o servidor de desenvolvimento:
npm run dev

Acesse http://localhost:5173 (ou a porta indicada no terminal).

## Estrutura do Projeto
Consulte o arquivo PROJECT_STRUCTURE.txt para detalhes sobre a organização de pastas.

## Objetivo da Fase 1
Criar o esqueleto do projeto, integrar Firebase Auth, configurar rotas protegidas e UserContext. Nenhuma lógica de negócio complexa (Bandas, Músicas) está inclusa.

## Fases Futuras
- Fase 2: Gestão de Bandas e Papéis
- Fase 3: Editor de Músicas e Playlists
- Fase 4: Modo Regência (Realtime) e WebSockets/Firestore Listeners
- Fase 5: Integração Stripe e Refinamento UX