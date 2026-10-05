# Design — chave local do editor sem secure context

## O que a chave é, de fato

`OptionForm.key` e `QuestionForm.key` existem para dois usos, ambos locais ao navegador: `key` de lista do React e correlação entre o item e seu `id` de campo (`htmlFor`/`id`, `aria-invalid`, mensagens de erro por pergunta). O servidor gera os identificadores definitivos; `toRequest()` não envia chave alguma. Portanto não há requisito de unicidade criptográfica, de imprevisibilidade nem de unicidade global — basta ser única dentro da sessão do navegador.

## Decisão

Sequência monotônica de módulo (`k1`, `k2`, …). Resolve em qualquer origem, não depende de API do navegador, e é determinística — o que facilita teste futuro do formulário.

Ao abrir um quiz existente, `toForm()` continua usando o `id` vindo do servidor como chave; só os itens criados na tela usam a sequência. Colisão entre as duas formas é impossível: os identificadores do servidor são GUIDs.

## Alternativas descartadas

- **`crypto.getRandomValues`**: também funciona fora de secure context e seria uma troca mínima, mas continua carregando uma API de criptografia para gerar chave de lista do React. Sequência simples diz melhor o que o valor é.
- **Fallback condicional (`crypto.randomUUID?.() ?? sequência`)**: mantém dois caminhos de código para o mesmo fim, com o caminho raro — justamente o que quebra — exercitado apenas em produção interna.
- **Índice do array como `key`**: React desaconselha para listas reordenáveis; o editor move e remove perguntas, e o índice como chave embaralharia estado de campo.
- **Exigir HTTPS no ingress interno**: resolve o sintoma onde há TLS, mas deixa a aplicação quebrada em publicação HTTP, por IP ou via port-forward. Vale por mérito próprio, não como correção deste defeito.
