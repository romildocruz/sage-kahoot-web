## 1. Documentação (.NET 10)

- [x] 1.1 Trocar ".NET 9" por ".NET 10" em `CLAUDE.md` (seção Contexto)
- [x] 1.2 Trocar ".NET 9" por ".NET 10" em `openspec/config.yaml` (context)
- [x] 1.3 Conferir com `grep` que só `docs/prompt-inicial.md` (histórico) ainda cita ".NET 9"

## 2. Patches de dependências

- [x] 2.1 Rodar `npm update @tanstack/react-query vite @vitejs/plugin-react oxlint @types/node`
- [x] 2.2 Conferir com `npm outdated` que só restam `typescript` 7 e `@types/node` 26 (majors fora do escopo) e que `typescript` segue em 5.9.x
- [x] 2.3 Conferir que `git diff` de `package.json` não mudou majors (idealmente nem mudou)

## 3. Verificação

- [x] 3.1 `npm run build` passa (`tsc -b` + `vite build`)
- [x] 3.2 `npm run lint` passa sem novos avisos
- [x] 3.3 Se algum pacote quebrar build/lint, reverter só ele no lock e registrar o motivo

## 4. Commit inicial

- [x] 4.1 `git branch -M main`
- [x] 4.2 `git add -A` e conferir `git status` / `git diff --cached --stat`: sem `dist/`, `node_modules/`, `.env*`
- [x] 4.3 Commit inicial com a mensagem e a atribuição definidas para commits desta sessão

## 5. Push para o GitHub (exige confirmação)

- [ ] 5.1 Pedir ao usuário a URL do repositório e confirmar a visibilidade (privado recomendado)
- [ ] 5.2 Após confirmação explícita: `git remote add origin <url>` e `git push -u origin main`
- [ ] 5.3 Conferir no GitHub que o conteúdo subiu e que não há arquivos indevidos
