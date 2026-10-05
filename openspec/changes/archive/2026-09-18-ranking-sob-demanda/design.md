# Design — ranking corrente sob demanda

## Contexto

A API passou a oferecer o ranking por dois caminhos: o endpoint REST `GET /api/v1/sessions/{sessionId}/ranking` e a invocação `GetRanking` no hub. Ambos devolvem o mesmo payload (`sessionId`, `entries`, `isFinal`) e têm a mesma regra de autorização: apresentador em qualquer sessão, participante apenas na do seu token.

## Decisões

**Consumir por REST, não pelo hub.** Mantém a decisão já registrada no projeto: o que tem contrato publicado vai pelo client tipado gerado do OpenAPI; o hub fica com eventos e `SyncState`. Como consequência, `quizHubMethods` não ganha `GetRanking`.

**Buscar na sincronização, não em intervalo.** A busca acontece no mesmo ponto em que o estado é sincronizado — conexão, reconexão e recarregamento —, que é exatamente onde a lacuna existia. Durante a sessão, o ranking continua chegando por `RankingUpdated`; nada de polling.

**Falha silenciosa.** Se a busca do ranking falhar, a tela segue com o estado sincronizado e o próximo `RankingUpdated` preenche o ranking. Alternativa descartada: propagar o erro para a área de mensagens, o que transformaria uma informação complementar em ruído no meio do treinamento.

**Tipos de ranking passam a vir do schema gerado.** `RankingPayload` e `RankingEntry` eram declarados à mão em `realtime/contracts.ts` porque não existiam no OpenAPI. Agora existem, então `contracts.ts` os reexporta do schema gerado, como já fazia com `QuestionOpenedPayload` e `SessionStatePayload`. Sem isso, o mesmo payload teria duas definições podendo divergir.

**Pódio a partir de `isFinal`.** No reducer do telão, um ranking marcado como final também alimenta o ranking final. É o que permite exibir o pódio para quem abre a tela depois do encerramento, sem ter recebido o evento `SessionEnded`.

## Alternativas descartadas

- **Consultar o ranking pelo hub (`GetRanking`)**: economizaria a requisição HTTP, mas exigiria manter à mão o tipo de retorno de uma invocação que já tem contrato publicado em REST.
- **Consulta contínua com intervalo**: geraria tráfego constante por participante para resolver um problema que só existe no instante da sincronização.
- **Derivar a posição final do participante a partir do ranking buscado**: fora do escopo desta mudança; a posição final continua vindo do evento de encerramento.
