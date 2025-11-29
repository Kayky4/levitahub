# LevitaHub - Fase 3: Módulo Musical

## Status: Concluído

## O que foi entregue?
Nesta fase, o coração do sistema foi implementado. Bandas agora podem gerenciar seu repertório e organizar seus eventos (playlists).

### Funcionalidades:
1. **Músicas**:
   - CRUD completo.
   - Editor de Seções (Blocos) para estruturar a cifra.
   - Visualização limpa (estilo CifraClub/SongSelect).
2. **Playlists**:
   - Criação de eventos.
   - Adição de músicas do repertório.
   - Ordenação via Drag & Drop.
3. **Permissões Refinadas**:
   - Lógica `canEditMusic` aplicada. Músicos são "Read-Only".

## Arquitetura
- **Novas Rotas**: `/band/:id/songs/*` e `/band/:id/playlists/*`.
- **Novos Serviços**: `services/songs.ts` e `services/playlists.ts`.
- **Banco de Dados**: Subcoleções `songs` e `playlists` criadas dentro de cada `band`.

## Como Testar
1. Entre como Líder/Vice.
2. Vá em "Músicas" -> "Nova Música".
3. Crie uma música colando uma cifra. Salve.
4. Vá em "Editar" na música criada e brinque com as Seções (adicione uma nova, mova para cima).
5. Volte ao Dashboard -> "Playlists".
6. Crie uma Playlist "Culto Teste".
7. Adicione a música criada.
8. (Opcional) Adicione outra música para testar o Drag & Drop.

## Próximos Passos (Fase 4 - Realtime)
A estrutura de dados `sections` criada na Fase 3 é a base para a Fase 4.
Na próxima fase, implementaremos:
- Listeners do Firestore em tempo real.
- Controle de qual seção está "ativa".
- Sincronização de scroll entre dispositivos.
