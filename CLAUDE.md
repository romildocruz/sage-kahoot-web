# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto

Frontend do quiz gamificado interno para uma empresa. SPA React 19 + Vite 8 + TypeScript que consome a
**sage-kahoot-api** (repositório separado, .NET 10 + FastEndpoints + MongoDB) por REST + SignalR.
Textos de UI, comentários, specs e documentação são em **português do Brasil**.

O público do quiz é sempre **"participante"** — nunca "jogador", "aluno" ou "estagiário".

## Comandos

```bash
npm install
cp .env.example .env.local     # ajuste DEV_API_TARGET se a API não estiver em localhost:5000
npm run dev                    # http://localhost:5173 (proxy de /api e /hubs, com ws:true)
npm run build                  # tsc -b && vite build
npm run lint                   # oxlint
npm run preview                # serve o build local
npm run api:types              # regenera src/api/generated/schema.ts a partir de ./openapi.json
```

Não há suíte de testes automatizados neste repositório. A verificação é `npm run build` (o `tsc -b`
é o gate de tipos) + `npm run lint` + o roteiro manual descrito no README.

OpenSpec:

```bash
npx openspec list --specs
npx openspec show <capability>
npx openspec validate --specs
```

## Arquitetura

### Camadas — regra dura

```
componente → hook (api/hooks) → endpoint (api/endpoints) → client tipado (api/client.ts)
```

- Nenhum componente chama `fetch`, monta URL ou lê `import.meta.env`/`window` direto.
- O hub SignalR só é tocado por `src/realtime/useQuizHub.ts`; telas recebem eventos por handlers.
- Toda configuração de ambiente passa por `src/config/env.ts`.
- `src/api/generated/schema.ts` é **gerado** — nunca editar à mão.

### Três clients HTTP, três públicos

`src/api/client.ts` expõe `publicApi`, `adminApi` e `participantApi` (openapi-fetch). Cada um injeta
o token do seu público e limpa o próprio store em 401. Não existe middleware que adivinha o público
pela URL — ao adicionar um endpoint, escolha explicitamente o client correto.

`unwrap()` converte o resultado do openapi-fetch em valor ou lança `ApiError`. Todo erro que sai da
camada de API é `ApiError` (`src/api/problem.ts`), inclusive falha de transporte (status 0).

### `Concrete<T>`

O NSwag marca toda propriedade de resposta como opcional. `Concrete<T>` (em `src/api/types.ts`)
remove o `?` recursivamente e preserva o `| null` real. Aliases legíveis de schema vivem ali — telas
importam de `api/types`, não de `api/generated/schema`.

### Comandos por REST, eventos pelo hub

Criar quiz, iniciar/avançar/encerrar sessão e responder vão por **REST** (tipos gerados, validação,
`problem+json` por campo). O hub `/hubs/quiz` fica com o que só ele faz: eventos e `SyncState`.
Não mova comandos para o hub — ele não tem contrato publicado.

O contrato do hub vive em `src/realtime/contracts.ts`, espelhado à mão de `Hubs/*.cs` da API. Ao
mudar algo lá, confira com `docs/contrato-hub-signalr.md` do repositório da API.

A opção correta **nunca** chega antes do fechamento da pergunta: `QuestionOpened` não a carrega; a
revelação vem em `QuestionClosed` (apresentador) ou `QuestionResult` (participante).

### Estado da sessão ao vivo

`hostSessionState.ts` e `playerSessionState.ts` são reducers: cada evento do hub é uma transição
explícita. A ação `synced` (de `SyncState`, na conexão e em cada reconexão) **substitui** o estado
local inteiro — não concilie com o que estava na tela; é a regra da API para reconexão.

Na reconexão, `useQuizHub` reentra no grupo (`JoinSessionGroup`) antes de sincronizar: a nova
connectionId não herda os grupos anteriores.

### Tempo

O relógio do servidor é a única autoridade. `useCountdown(remainingSeconds, resetKey)` reancora o
prazo local em `agora + remainingSeconds` a cada payload novo (`resetKey` = `questionId`). Nunca
compare o relógio do cliente com o do servidor nem envie tempo no `SubmitAnswer`.

### Tokens

`src/auth/tokenStore.ts`: apresentador em `localStorage` (prepara o treinamento em várias visitas),
participante em `sessionStorage` (vale para aquela aba/treinamento). Nada além do token é guardado.
Token expirado é descartado na leitura, antes de qualquer requisição.

`RequireAdmin` é conveniência de UI, não segurança — quem autoriza é a API.

### Rotas e superfícies

| Superfície | Rota | Observação |
|---|---|---|
| Participante | `/`, `/play` | mobile-first, anônimo (PIN + apelido) |
| Apresentador | `/admin/**` | dentro de `RequireAdmin` + `AdminLayout` |
| Telão | `/admin/sessions/:sessionId` | dentro de `RequireAdmin`, **fora** do `AdminLayout` (tela cheia) |

### Configuração em runtime

Uma imagem Docker para todos os ambientes. `deploy/nginx/05-runtime-config.envsh` regrava
`config.js` no start do container a partir do ConfigMap (`API_BASE_URL`, `JOIN_URL_BASE`) e preenche
o `connect-src` do CSP. As variáveis `VITE_*` valem só como padrão de desenvolvimento.

`API_BASE_URL` aqui precisa ser coerente com `Cors__AllowedOrigins__0` na API.

### Estilos

CSS global único (`src/styles/global.css`) com tokens em `:root` e classes utilitárias
(`.page`, `.card`, `.stack`, `.row-between`, `.badge`…). Sem CSS-in-JS, sem Tailwind, sem módulos.
As cores das opções (`--option-1..6`) são compartilhadas entre telão e celular — mesma cor e mesma
forma para a mesma posição; ver `src/lib/optionStyle.ts`.

### Cache (TanStack Query)

`src/app/providers.tsx`: sem retry em 4xx, `staleTime` 15s, sem `refetchOnWindowFocus`. Chaves só em
`src/api/queryKeys.ts`, invalidação por prefixo — sem string solta nas telas.

## Fluxo de mudança (OpenSpec)

O comportamento atual está descrito como baseline em `openspec/specs/` (uma capability por arquivo:
`admin-access`, `quiz-authoring`, `host-console`, `participant-play`, `realtime-client`,
`api-integration`, `session-reporting`, `web-platform`).

Mudança de comportamento segue: proposta de change → aprovação → aplicação → sync/archive das specs
(skills `openspec-*` / comandos `/opsx:*`). Editar `openspec/specs/` direto só se justifica para
corrigir a descrição de algo que já está implementado.

## Divergências conhecidas do contrato da API

1. **Status da sessão tem duas representações.** `SessionDto` e relatórios devolvem o enum numérico
   (`0..3`); `GET /sessions/{id}/state` e `SyncState` devolvem o nome em string. Normalize sempre com
   `parseSessionStatus` (`src/api/types.ts`).
2. **`SubmitAnswer` no hub não devolve valor** (declarado como `Task`), apesar do que diz a doc da
   API. Irrelevante aqui: este app responde por REST e a confirmação vem do evento `AnswerAccepted`.

## Restrições

- **TypeScript fixado em `~5.9`** — `openapi-typescript@7` declara peer `typescript@^5.x`. Não subir
  para TS 6 até o gerador suportar.
- Sem dados pessoais reais em exemplos, seeds ou docs — apelidos e conteúdo sintéticos.
- Nenhum segredo entra no bundle: o build de um SPA é público por definição.
