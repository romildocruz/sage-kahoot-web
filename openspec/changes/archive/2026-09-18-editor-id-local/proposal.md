# Chave local do editor de quiz sem depender de secure context

## Why

O editor de quiz quebra ao abrir em qualquer origem que não seja secure context: `crypto.randomUUID()` é definido pela especificação como `[SecureContext]` e fica `undefined` fora de `https://`, `http://localhost` e `http://127.0.0.1`. Como a chamada está no estado inicial do formulário (`useState(emptyQuiz)`), o erro acontece na montagem da tela, antes mesmo de o quiz chegar da API — atinge tanto criar quanto editar. Reproduzido no cluster local em `http://sage-kahoot.localtest.me`, mas vale para qualquer publicação interna em HTTP puro ou acesso por IP.

## What Changes

- `src/features/admin/quizForm.ts`: gerar a chave local por sequência de módulo, em vez de `crypto.randomUUID()`.
- Nada mais muda. É a única ocorrência de `randomUUID` no projeto e nenhuma outra API restrita a secure context é usada.

## Capabilities

**New Capabilities**: nenhuma.

**Modified Capabilities**: nenhuma — por isso `skip_specs: true`.

É correção de defeito: a capability `quiz-authoring` já exige que o editor abra preenchido com o quiz e suas perguntas (requisito "Editor de quiz com o agregado completo"). O comportamento especificado não muda; ele passa a acontecer de fato.

## Impact

- Código: um arquivo, uma função.
- Imagem e deploy: exige rebuild e redeploy do `sage-kahoot-web` para valer no cluster.
- Sem impacto em contrato, API, configuração ou no sage-kahoot-api.
- Sem impacto em dados: a chave nunca sai do navegador — `toRequest()` envia apenas `text`, `timeLimitSeconds`, `basePoints` e `options{text,isCorrect}`.
