# Tarefas — chave local do editor sem secure context

Correção aprovada pelo solicitante e aplicada no mesmo turno, com redeploy no cluster local.

## 1. Correção

- [x] 1.1 Substituir `crypto.randomUUID()` por sequência de módulo em `src/features/admin/quizForm.ts`
- [x] 1.2 Documentar no código por que não é `crypto.randomUUID` (API `[SecureContext]`) e o que a chave é

## 2. Verificação

- [x] 2.1 `npm run build` sem erro
- [x] 2.2 Confirmar que `randomUUID` não existe mais no bundle gerado
- [x] 2.3 Prova funcional em Node com `Crypto.prototype.randomUUID` removido: `emptyQuiz()` monta, chaves únicas, `validate()` sem erros e `toRequest()` sem `key` no payload
- [x] 2.4 Rebuild da imagem `sage-kahoot-web:local` e redeploy no namespace `sage-kahoot`
- [x] 2.5 Confirmar que o bundle servido pelo Ingress não contém `randomUUID`
- [x] 2.6 Validação no navegador pelo solicitante: abrir o quiz de exemplo em `http://sage-kahoot.localtest.me/admin` — confirmado funcionando
