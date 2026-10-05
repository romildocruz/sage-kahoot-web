# Ranking corrente sob demanda na sincronização

## Why

O ranking chegava ao frontend apenas por push (`RankingUpdated`). Quem recarregava o telão ou reconectava entre perguntas ficava sem ranking até o próximo evento, e quem abria a tela depois do encerramento não via pódio nenhum — a sincronização de estado devolve a pergunta corrente, não as posições. A sage-kahoot-api passou a expor o ranking sob demanda (`GET /api/v1/sessions/{sessionId}/ranking`, e a invocação equivalente `GetRanking` no hub), o que fecha essa lacuna.

## What Changes

- Consumir o novo endpoint `GET /api/v1/sessions/{sessionId}/ranking` (autorizado para apresentador e para participante, este último apenas na sessão do próprio token).
- Buscar o ranking corrente sempre que a tela sincronizar estado com o servidor — conexão inicial, reconexão e recarregamento — no telão e na tela do participante.
- Usar `isFinal` do payload para exibir o pódio de uma sessão já encerrada sem depender do evento de fim de sessão.
- Nenhuma mudança de evento do hub: `IQuizClient` permanece igual. Não há mudança incompatível.

## Capabilities

**New Capabilities**: nenhuma.

**Modified Capabilities**:
- `host-console` — ranking e pódio passam a estar disponíveis na sincronização, não só por evento.
- `participant-play` — o participante que reconecta passa a ver o ranking imediatamente.

`api-integration` e `realtime-client` não mudam de comportamento: o endpoint novo é consumido pelas camadas já descritas (token por público, tipos gerados do contrato) e a consulta é feita por REST, como os demais comandos.

## Impact

- Contrato: `openapi.json` atualizado e `src/api/generated/schema.ts` regenerado por `npm run api:types`.
- Código: `api/endpoints/sessions.ts`, `api/hooks/useSessions.ts`, `api/queryKeys.ts`, `api/types.ts`, `realtime/contracts.ts` (os tipos de ranking passam a vir do schema gerado, em vez de declarados à mão), `features/host/HostSessionPage.tsx`, `features/host/hostSessionState.ts`, `features/player/PlayerPage.tsx`.
- Rede: uma requisição adicional por sincronização, por cliente conectado. Irrelevante na escala de uso (dezenas de participantes por sessão).
- Sem impacto em deploy, configuração ou dependências.
