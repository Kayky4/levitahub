# LevitaHub - Fase 4: Modo Regência (Realtime)

## Status: Concluído

## Resumo
Esta fase transformou o LevitaHub de um simples repositório de cifras em uma ferramenta de performance ao vivo. O **Modo Regência** permite que um líder controle remotamente o que aparece na tela de todos os músicos da banda.

## Funcionalidades Entregues
1. **Sincronização Firestore**:
   - Documento único de sessão (`bands/{id}/regency/session`).
   - Baixíssima latência.
2. **Painel do Regente**:
   - Controle de Música (seleção via playlist).
   - Controle de Seção (Grid de botões).
   - Envio de Cues (Preset e Custom).
3. **Visualizador do Músico**:
   - Auto-scroll.
   - Destaque visual da seção ativa.
   - Popups de alerta.

## Como Testar (Simulação Real)
Para testar a mágica do tempo real, você precisa de **duas janelas/dispositivos**:

1. **Janela A (Líder)**:
   - Logue como líder.
   - Vá em uma Playlist e clique "Iniciar Regência".
   - O Painel Escuro de controle abrirá.

2. **Janela B (Músico)**:
   - Logue com outra conta (ou aba anônima) que seja membro da mesma banda.
   - Vá no Dashboard e clique em "Acompanhar" no card vermelho.
   - Você verá a música carregada.

3. **Ação**:
   - Na Janela A, clique em "Refrão".
   - Veja a Janela B rolar e destacar o Refrão instantaneamente.
   - Na Janela A, clique em "SOBE TOM".
   - Veja o popup aparecer na Janela B.

## O que vem na Fase 5?
- Integração com Stripe (Pagamentos).
- Ajustes finos de UX.
- Landing Page oficial.
