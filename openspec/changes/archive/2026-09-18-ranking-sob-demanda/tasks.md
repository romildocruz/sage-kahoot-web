# Tarefas — ranking corrente sob demanda

Implementação já aplicada no código a pedido do solicitante, junto com a regeneração do contrato. As
specs desta change permanecem como proposta, aguardando aprovação antes do sync para `openspec/specs/`.

## 1. Contrato

- [x] 1.1 Atualizar `openapi.json` com o contrato mais recente da sage-kahoot-api
- [x] 1.2 Regenerar `src/api/generated/schema.ts` com `npm run api:types`
- [x] 1.3 Conferir no diff do contrato o que mudou de fato (novo `GET /sessions/{sessionId}/ranking`; nenhum evento novo no hub)

## 2. Camada de API

- [x] 2.1 Adicionar os aliases `RankingPayload` e `RankingEntry` em `api/types.ts`
- [x] 2.2 Adicionar `getSessionRankingAsAdmin` e `getSessionRankingAsParticipant` em `api/endpoints/sessions.ts`
- [x] 2.3 Adicionar a chave de cache `sessions.ranking` em `api/queryKeys.ts`
- [x] 2.4 Adicionar o hook `useFetchSessionRanking(audience)` em `api/hooks/useSessions.ts`
- [x] 2.5 Reexportar `RankingPayload`/`RankingEntry` do schema gerado em `realtime/contracts.ts`, removendo as declarações manuais

## 3. Telas

- [x] 3.1 Buscar o ranking na sincronização do telão (`features/host/HostSessionPage.tsx`)
- [x] 3.2 Alimentar `finalRanking` quando o ranking vier marcado como final (`features/host/hostSessionState.ts`)
- [x] 3.3 Buscar o ranking na sincronização da tela do participante (`features/player/PlayerPage.tsx`)

## 4. Verificação

Os testes manuais (4.3 e 4.4) foram executados e validados pelo solicitante, não pelo agente.

- [x] 4.1 `npm run build` (tsc + vite) sem erro
- [x] 4.2 `npm run lint` sem warning novo em relação à baseline
- [x] 4.3 Teste manual com a API rodando: recarregar o telão entre perguntas e abrir o telão de uma sessão encerrada
- [x] 4.4 Teste manual: reconectar o participante entre perguntas e conferir o destaque da própria linha
