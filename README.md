# sage-kahoot-web

Frontend do quiz gamificado interno de uma empresa. Consome a **sage-kahoot-api** (REST + SignalR) e entrega
duas superfícies de uso:

| Superfície | Rota | Público | Autenticação |
|---|---|---|---|
| Participante | `/` e `/play` | celular/desktop do participante | anônima — PIN + apelido |
| Apresentador | `/admin/**` | facilitador do treinamento | usuário e senha únicos → token JWT |
| Telão | `/admin/sessions/:sessionId` | projetor/TV | token do apresentador |

Stack: React 19 + Vite 8 + TypeScript, TanStack Query, React Router, `@microsoft/signalr` e um client
HTTP gerado a partir do contrato OpenAPI da API.

---

## Sumário executivo

- O contrato REST **não é escrito à mão**: `openapi.json` (gerado pelo NSwag na sage-kahoot-api) vira
  tipos TypeScript via `openapi-typescript`, e as chamadas passam por `openapi-fetch`. Nenhum
  componente chama `fetch` diretamente.
- O contrato do hub SignalR não existe no OpenAPI; foi derivado do código-fonte da API
  (`Hubs/HubContracts.cs`, `Hubs/QuizHub.cs`, `Realtime/SignalRSessionNotifier.cs`) e conferido com
  `docs/contrato-hub-signalr.md` do repositório da API. Vive em `src/realtime/contracts.ts`.
- Comandos (criar quiz, iniciar/avançar/encerrar sessão, responder) vão por **REST**; eventos e
  sincronização de estado vêm pelo **hub**. Ver "Decisões" abaixo.
- O relógio do servidor é a única autoridade sobre o tempo: a contagem regressiva local é sempre
  reancorada no `remainingSeconds` que chega do servidor.
- A imagem Docker é única para todos os ambientes: a URL da API é injetada em runtime
  (`config.js` regravado no start do container a partir do ConfigMap).

---

## Estrutura

```
src/
  api/
    generated/schema.ts     # GERADO — não editar (npm run api:types)
    client.ts               # clients openapi-fetch: público, admin e participante
    types.ts                # aliases legíveis sobre o schema gerado
    problem.ts              # problem+json (RFC 7807/9457) -> ApiError
    endpoints/              # uma função por operação do contrato
    hooks/                  # hooks TanStack Query sobre os endpoints
    queryKeys.ts
  realtime/
    contracts.ts            # eventos e invocações do hub /hubs/quiz
    hubConnection.ts        # fábrica da conexão, JoinSessionGroup, SyncState
    useQuizHub.ts           # ciclo de vida da conexão, reconexão e distribuição de eventos
  auth/
    tokenStore.ts           # token do admin (localStorage) e do participante (sessionStorage)
    useAdminSession.ts / useParticipantSession.ts
  features/
    admin/                  # login, CRUD de quiz, relatórios
    host/                   # telão: máquina de estados da sessão ao vivo
    player/                 # celular do participante
  components/               # peças compartilhadas pelas três superfícies
  config/env.ts             # única leitura de configuração de ambiente
  lib/                      # formatação, contagem regressiva, download
```

Camadas: **componente → hook → endpoint → client tipado**. Uma tela nunca fala com `fetch` nem monta
URL; o hub só é tocado por `useQuizHub`.

---

## Specs (OpenSpec)

O comportamento atual está descrito como baseline em `openspec/specs/`, uma capability por arquivo:

| Capability | Cobre |
|---|---|
| `admin-access` | login do apresentador, guarda de rotas, ciclo de vida do token |
| `quiz-authoring` | listagem, editor, limites do contrato, duplicar/excluir, abertura de sessão |
| `host-console` | telão: sala de espera, condução, revelação, ranking, pódio |
| `participant-play` | entrada por PIN, sala de espera, resposta, resultado individual |
| `realtime-client` | conexão do hub, reingresso, reconexão, sincronização, tempo do servidor |
| `api-integration` | tipos gerados, tokens por público, erro uniforme, cache, exportação |
| `session-reporting` | histórico com filtros, relatório detalhado, desempenho por pergunta |
| `web-platform` | rotas, configuração em runtime, empacotamento, deploy, acessibilidade |

Daqui em diante, mudança de comportamento segue o fluxo do OpenSpec: proposta de change → aprovação →
aplicação → sync/archive das specs. Editar `openspec/specs/` direto só se justifica para corrigir a
descrição de algo que já está implementado.

```bash
npx openspec list --specs        # capabilities e quantidade de requisitos
npx openspec show <capability>   # conteúdo de uma spec
npx openspec validate --specs    # valida o formato
```

---

## Contrato consumido

### REST (`openapi.json`)

| Operação | Rota | Quem |
|---|---|---|
| Login do apresentador | `POST /api/v1/auth/login` | público |
| CRUD de quiz | `GET/POST /api/v1/quizzes`, `GET/PUT/DELETE /api/v1/quizzes/{quizId}` | admin |
| Duplicar quiz | `POST /api/v1/quizzes/{quizId}/duplicate` | admin |
| Abrir sessão (gera o PIN) | `POST /api/v1/sessions` | admin |
| Entrar por PIN | `POST /api/v1/sessions/join` | público |
| Controle da sessão | `POST /api/v1/sessions/{sessionId}/start`, `/advance`, `/end` | admin |
| Estado corrente | `GET /api/v1/sessions/{sessionId}/state` | admin ou participante |
| Responder | `POST /api/v1/sessions/{sessionId}/answers` | participante |
| Histórico e relatório | `GET /api/v1/reports/sessions`, `/{sessionId}`, `/{sessionId}/export?format=csv\|json` | admin |

### SignalR (`/hubs/quiz`)

Token na query string (`?access_token=`), como a API exige — o handshake WebSocket não aceita
cabeçalho customizado. Após conectar, o cliente invoca `JoinSessionGroup(sessionId)` e `SyncState(sessionId)`.

Eventos escutados: `ParticipantJoined`, `ParticipantLeft`, `SessionStarted`, `QuestionOpened`,
`AnswerCountChanged` (só host), `AnswerAccepted` (participante), `QuestionClosed` (só host),
`QuestionResult` (participante), `RankingUpdated`, `SessionEnded` (só host), `ParticipantSessionEnded`.

A opção correta nunca chega antes do fechamento da pergunta: `QuestionOpened` não a carrega, e a
revelação vem em `QuestionClosed` (apresentador) ou `QuestionResult` (participante).

### Regenerar os tipos

```bash
# após atualizar ./openapi.json a partir do Swagger da API
npm run api:types
```

---

## Desenvolvimento

```bash
npm install
cp .env.example .env.local     # ajuste DEV_API_TARGET se a API não estiver em localhost:5000
npm run dev                    # http://localhost:5173
```

O servidor de desenvolvimento faz proxy de `/api` e `/hubs` (com WebSocket) para a API, então não é
preciso incluir `http://localhost:5173` na lista de CORS da API durante o desenvolvimento.

```bash
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run preview    # serve o build local
```

### Roteiro de teste manual

1. Suba a sage-kahoot-api com o seed sintético habilitado (`Seed__Enabled=true`).
2. `/admin/login` → credencial configurada no Secret da API.
3. Em **Quizzes**, "Iniciar sessão" em um quiz com perguntas → o telão abre com o PIN.
4. Em outra aba (ou no celular), `/` → PIN + apelido.
5. No telão: "Iniciar quiz" → "Encerrar pergunta" → "Próxima pergunta" → "Encerrar sessão".
6. Relatório da sessão com pódio, ranking e exportação CSV/JSON.

---

## Build e deploy

```bash
docker build -t {{REGISTRY_IMAGENS}}/sage-kahoot-web:latest .
kubectl -n {{NAMESPACE_K8S}} apply -f deploy/k8s/k8sdeploy.yml
```

Configuração do pod (ConfigMap `sage-kahoot-web-config`):

| Variável | Efeito |
|---|---|
| `API_BASE_URL` | origem da sage-kahoot-api usada em REST e no hub. Vazio = mesma origem |
| `JOIN_URL_BASE` | endereço exibido no telão para o participante entrar |

Ambas são lidas no start do container por `deploy/nginx/05-runtime-config.envsh`, que gera o
`config.js` servido ao navegador e preenche o `connect-src` do CSP. Não há Secret: o bundle de um SPA
é público por definição e nada sensível entra nele.

`API_BASE_URL` precisa ser coerente com `Cors__AllowedOrigins__0` da API — lá a origem autorizada é a
deste frontend, aqui é o destino das chamadas.

---

## Decisões e trade-offs

**Comandos por REST, eventos pelo hub.** O `QuizHub` expõe `StartSession`, `AdvanceQuestion`,
`EndSession` e `SubmitAnswer` — os mesmos handlers das rotas REST. Optamos pelo REST para os comandos
porque é o caminho descrito pelo contrato OpenAPI (tipos gerados, validação e `problem+json` por
campo); o hub, que não tem contrato publicado, fica com o que só ele faz: eventos e `SyncState`.
Custo: um round-trip HTTP a mais por comando, irrelevante nesta escala. Alternativa descartada: tudo
pelo hub, que economizaria a chamada mas exigiria manter à mão os tipos de todos os comandos.

**Estado da sessão em reducer por superfície.** `hostSessionState.ts` e `playerSessionState.ts`
transformam cada evento em uma transição explícita. `SyncState` **substitui** o estado local em vez de
tentar conciliá-lo — é a regra da API para reconexão.

**Contagem regressiva reancorada.** A cada `QuestionOpened` (ou `SyncState`) o prazo local vira
`agora + remainingSeconds`. O relógio do cliente nunca é comparado com o do servidor, e o servidor
ignora qualquer tempo enviado pelo cliente no cálculo da pontuação.

**Dois escopos de armazenamento de token.** Apresentador em `localStorage` (prepara o treinamento em
várias visitas); participante em `sessionStorage` (vale para aquela aba e aquele treinamento).

**Configuração em runtime, não em build.** Uma imagem por ambiente exigiria rebuild a cada mudança de
host. O `config.js` gerado no start resolve isso sem servidor de aplicação.

**`Concrete<T>` sobre o schema gerado.** O NSwag marca toda propriedade de resposta como opcional
(os records C# não declaram `required` no JSON Schema), o que encheria as telas de `?.` e `?? 0`. O
utilitário em `api/types.ts` remove o opcional e preserva o `| null` de quem é de fato anulável.
Trade-off assumido: se a API passar a omitir um campo, o erro aparece em runtime, não na compilação.

**TypeScript fixado em 5.9.** O template do Vite vem com TS 6, mas `openapi-typescript@7` declara peer
`typescript@^5.x`. Preferimos fixar a versão a instalar com peer quebrado. Revisar quando o gerador
suportar TS 6.

---

## Divergências encontradas no contrato

Não bloqueiam o uso, mas valem alinhamento com o time da API:

1. **Status da sessão com duas representações.** `SessionDto` e os relatórios devolvem o enum numérico
   (`0..3`); `GET /sessions/{id}/state` e `SyncState` devolvem o **nome** em string. O frontend
   normaliza em `parseSessionStatus` (`src/api/types.ts`).
2. **Retorno de `SubmitAnswer` no hub.** `docs/contrato-hub-signalr.md` indica `AnswerAcceptedResult`,
   mas `QuizHub.SubmitAnswer` é declarado como `Task` — pelo protocolo do SignalR, o cliente não
   recebe valor de retorno. Como este app responde por REST, o ponto não afeta o funcionamento; a
   confirmação vem do evento `AnswerAccepted`.

---

## Riscos de segurança sinalizados

- **Token em storage do navegador** é legível por XSS. Mitigação adotada: nada além do token é
  guardado, CSP restritiva no nginx e expiração respeitada no cliente (o token expirado é descartado
  antes de qualquer requisição). Aplicação interna, sem exposição pública.
- **Token do hub na query string** aparece em logs de proxy. É imposição do WebSocket e a API só o
  aceita no caminho do hub — vale conferir se o Ingress interno registra query string nos logs.
- **CORS e CSP precisam andar juntos**: `API_BASE_URL` aqui e `Cors__AllowedOrigins` na API. Curinga
  é recusado na inicialização da API, o que é o comportamento desejado.
- **Rate limit de login e de join** é aplicado pela API (429). O frontend apenas exibe a mensagem; não
  há tentativa automática de repetição em 4xx.
- **A guarda de rota `/admin` é conveniência de UI**, não segurança: quem autoriza é a API.
- **Sem dados pessoais**: o participante entra com apelido, e o campo avisa para não usar nome real.
  Nenhum dado de exemplo neste repositório contém PII.

## Convenções específicas do projeto (não inferíveis só pelo código)

### Stack
- React + Vite + TypeScript.
- Duas superfícies de UI: tela do apresentador (telão/projetor, com login simples de
  admin) e tela do participante (mobile-first, sem login — acesso via PIN de sessão).

### Fonte da verdade do contrato de API
- O arquivo `openapi.json` nesta pasta é um **snapshot exportado do Swagger** da
  `sage-kahoot-api` (pasta irmã em `C:\dev\sage-kahoot-api`). É a fonte da verdade
  para endpoints, payloads e status codes — **nunca inventar ou assumir endpoints**
  que não estejam nele.
- O client HTTP usado no projeto é **gerado a partir do `openapi.json`** (via
  openapi-typescript/orval ou equivalente). Não escrever chamadas `fetch` manuais
  direto nos componentes — sempre passar pelo client gerado.
- Sempre que a API mudar o contrato, repetir: (1) re-exportar `openapi.json` a partir
  do Swagger da API rodando localmente, (2) regenerar o client tipado, (3) revisar
  apenas os componentes/hooks afetados pela mudança.

### SignalR
- Os métodos/eventos do Hub **não aparecem no `openapi.json`** (OpenAPI só cobre
  REST). Quando precisar integrar com o Hub, ler diretamente o código-fonte do(s)
  Hub(s) em `../sage-kahoot-api` (pasta irmã) para confirmar nomes de métodos,
  parâmetros e eventos emitidos.

### OpenSpec
- O projeto já tem uma baseline de specs criada retroativamente a partir do código
  existente. Toda mudança nova deve seguir o fluxo normal: proposta de change →
  aprovação → aplicação.

### Ambiente / Kubernetes local
- Deploy no namespace `sage-kahoot` (Rancher Desktop / Kubernetes local).
- Para pausar a aplicação sem apagar a configuração: escalar Deployment para
  `replicas: 0`.
- Placeholders ainda pendentes de preenchimento: `{{NAMESPACE_K8S}}`,
  `{{DOMINIO_INTERNO}}`, `{{REGISTRY_IMAGENS}}`.