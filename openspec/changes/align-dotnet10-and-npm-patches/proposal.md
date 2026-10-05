## Why

A sage-kahoot-api migrou para .NET 10 e a verificação do contrato mostrou que o frontend **não é afetado**:
o `openapi.json`, o hub SignalR e o `@microsoft/signalr` (`^10.0.11`) já estão alinhados. O que sobrou é
documentação ainda dizendo ".NET 9" e patches de dependências npm pendentes. Além disso, o código ainda
não tem nenhum commit e precisa subir para o GitHub.

## What Changes

- Corrigir a versão do backend de ".NET 9" para ".NET 10" em `CLAUDE.md` e `openspec/config.yaml`.
  `docs/prompt-inicial.md` é o registro histórico do prompt original e **não** é alterado.
- Atualizar dentro do intervalo já declarado no `package.json` (sem mudar major):
  `@tanstack/react-query` 5.103.1→5.104.1, `vite` 8.3.0→8.3.2, `@vitejs/plugin-react` 6.1.1→6.1.2,
  `oxlint` 1.83→1.87, e `@types/node` dentro da linha 24.
- Manter fora do escopo: `typescript` 7 (o `CLAUDE.md` fixa `~5.9`) e `@types/node` 26 (major, e o runtime
  da imagem é Node 24).
- Criar o commit inicial do repositório e **propor** o push para o GitHub. O push só é executado após
  confirmação explícita, com a URL do repositório informada pelo usuário.

Nenhuma mudança de comportamento, de API ou de contrato.

## Capabilities

### New Capabilities
<!-- nenhuma -->

### Modified Capabilities
<!-- nenhuma: nenhum requisito muda; a change usa skip_specs: true -->

## Impact

- Arquivos: `package.json` (só se algum intervalo precisar subir), `package-lock.json`, `CLAUDE.md`,
  `openspec/config.yaml`.
- Dependências: apenas patch/minor dentro do intervalo atual; `src/api/generated/schema.ts` não é regenerado.
- Repositório: primeiro commit na branch `main` e configuração do remote `origin`.
- Verificação: `npm run build` e `npm run lint` devem passar antes do commit.
