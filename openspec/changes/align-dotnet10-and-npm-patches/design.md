## Context

Ver proposal.md (Why). Estado atual verificado em modo explore: a branch local é `master` sem commits, o
branch principal configurado é `main`, `.gitignore` já cobre `node_modules`, `dist` e `.env.local`, e
`.claude/` está sem rastreio. As versões instaladas diferem das mais novas apenas por patch/minor dentro
dos intervalos do `package.json`.

## Goals / Non-Goals

**Goals:**
- Documentação coerente com o backend real (.NET 10).
- Dependências no último patch/minor compatível, com build e lint verdes.
- Histórico do repositório começando limpo e publicável.

**Non-Goals:**
- Mudar majors (`typescript` 7, `@types/node` 26).
- Regenerar `schema.ts` ou mexer em `openapi.json` (o contrato não mudou).
- Alterar `docs/prompt-inicial.md`, que é registro histórico.

## Decisions

1. **`npm update` em vez de editar `package.json` à mão.** Os intervalos com `^` já admitem as versões
   novas; só o `package-lock.json` muda. `typescript` fica protegido pelo `~5.9`. Alternativa descartada:
   `npm-check-updates`, que reescreveria intervalos e traria os majors.
2. **`@types/node` fica na linha 24**, igual ao Node 24 da imagem Docker. A 26 não corresponde ao runtime.
3. **Renomear a branch local para `main` antes do commit** (`git branch -M main`), alinhando com a branch
   principal usada nos PRs. Evita ter de renomear depois do push.
4. **Um único commit inicial com tudo, incluindo `.claude/`.** Os comandos/skills do OpenSpec fazem parte
   do fluxo documentado no `CLAUDE.md`; quem clonar precisa deles. Não há segredos ali (conferido).
   Se o usuário preferir não versionar, basta adicionar `.claude/` ao `.gitignore` antes do commit.
5. **Push é proposto, não automático.** Envio ao GitHub publica o conteúdo e pode ser indexado. O push
   só ocorre depois de o usuário informar a URL do repositório e confirmar; o `origin` é adicionado só
   nesse momento.
6. **Ordem:** docs → patches → build/lint → commit → (confirmação) → push. Assim o commit inicial já
   nasce verificado.

## Risks / Trade-offs

- [Patch do Vite/oxlint muda comportamento do build ou acusa novos avisos] → rodar `npm run build` e
  `npm run lint`; se falhar, reverter o lock e manter a versão anterior daquele pacote.
- [Repositório público expõe os placeholders do k8s e a descrição do ambiente interno] → confirmar a
  visibilidade (privado recomendado) antes do push.
- [`git add -A` incluir algo indevido] → conferir `git status` e `git diff --cached --stat` antes de
  commitar, sem `dist/`, `node_modules/` ou `.env*`.
