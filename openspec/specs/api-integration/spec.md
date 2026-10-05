## Purpose

Descreve como o sage-kahoot-web fala com a API REST: tipos gerados do contrato, separação dos tokens por público, tratamento uniforme de erro e política de cache. O princípio é que o contrato da API é a fonte da verdade e não é transcrito à mão em lugar nenhum.

## Requirements

### Requirement: Tipos derivados do contrato OpenAPI
Os tipos das requisições e respostas REST SHALL ser gerados a partir do `openapi.json` publicado pela sage-kahoot-api, por um script versionado do projeto. O arquivo gerado MUST NOT ser editado à mão, e nenhuma rota, payload ou código de status SHALL ser declarado manualmente em paralelo ao contrato.

#### Scenario: Contrato atualizado
- **WHEN** a API publica um contrato novo e o arquivo do projeto é atualizado
- **THEN** a regeneração SHALL ser feita pelo script do projeto
- **AND** incompatibilidades SHALL aparecer como erro de compilação

#### Scenario: Necessidade de um endpoint novo
- **WHEN** uma tela precisa de uma operação inexistente no contrato
- **THEN** a operação MUST NOT ser escrita à mão no frontend antes de existir no contrato da API

### Requirement: Camadas de acesso à API
O acesso à API SHALL ser organizado em camadas: um client tipado, funções de endpoint por operação do contrato e hooks de consulta e mutação usados pelas telas. Componentes MUST NOT chamar `fetch` diretamente nem montar URL de API.

#### Scenario: Tela consome dados
- **WHEN** uma tela precisa de dados da API
- **THEN** SHALL usar um hook, que usa uma função de endpoint, que usa o client tipado

### Requirement: Token correto por público
SHALL haver clients distintos para rotas públicas, de apresentador e de participante. Cada client SHALL anexar apenas o token do seu público, e as rotas públicas SHALL ser chamadas sem token. Ao receber 401, o client SHALL descartar o token guardado do seu público.

#### Scenario: Rota administrativa
- **WHEN** uma operação administrativa é chamada
- **THEN** o token do apresentador SHALL ser enviado no cabeçalho de autorização

#### Scenario: Rota de participante
- **WHEN** a resposta a uma pergunta é enviada
- **THEN** o token do participante SHALL ser enviado no cabeçalho de autorização

#### Scenario: Rota pública
- **WHEN** o login ou a entrada por PIN é chamada
- **THEN** nenhum token SHALL ser enviado

#### Scenario: Token rejeitado
- **WHEN** um client recebe 401
- **THEN** o token guardado daquele público SHALL ser descartado

### Requirement: Erro uniforme a partir de problem+json
Toda falha de API SHALL ser convertida em um tipo de erro único da aplicação, preservando o código de status, a mensagem legível e, quando houver, os erros por campo do formato de validação da API. Falha de transporte — API inacessível, rede indisponível, CORS — SHALL virar o mesmo tipo de erro, com mensagem orientando a verificar a conexão com a rede interna.

#### Scenario: Erro de validação com campos
- **WHEN** a API responde 400 com lista de erros por campo
- **THEN** o erro resultante SHALL permitir recuperar a mensagem de um campo específico

#### Scenario: Erro de regra de negócio
- **WHEN** a API responde 409 com detalhe da recusa
- **THEN** o erro resultante SHALL expor esse detalhe como mensagem exibível

#### Scenario: API inacessível
- **WHEN** a requisição falha antes de obter resposta
- **THEN** o erro resultante SHALL ser do mesmo tipo, distinguível por não ter código de status de resposta

#### Scenario: Status sem mensagem da API
- **WHEN** a API responde um erro sem detalhe nem título
- **THEN** o erro resultante SHALL usar uma mensagem padrão correspondente ao código de status

### Requirement: Política de repetição e cache
Consultas MUST NOT ser repetidas automaticamente em erro 4xx, por serem respostas legítimas do contrato. Falhas de outra natureza SHALL admitir repetição limitada. Mutações MUST NOT ser repetidas automaticamente. Após uma mutação, as consultas afetadas SHALL ser invalidadas por prefixo de chave, sem invalidação global do cache.

#### Scenario: Recurso inexistente
- **WHEN** uma consulta recebe 404
- **THEN** a consulta MUST NOT ser repetida automaticamente

#### Scenario: Quiz alterado
- **WHEN** uma mutação de quiz é concluída
- **THEN** as consultas de quizzes SHALL ser invalidadas

#### Scenario: Sessão aberta ou encerrada
- **WHEN** uma sessão é aberta ou encerrada
- **THEN** as consultas de relatórios SHALL ser invalidadas

### Requirement: Normalização das representações do contrato
Onde o contrato expõe a mesma informação em representações diferentes, a aplicação SHALL normalizar em um único formato interno. O status da sessão, devolvido como valor numérico nas rotas de sessão e relatório e como nome em texto na rota de estado e na sincronização do hub, SHALL ser normalizado no valor numérico do domínio.

#### Scenario: Status vindo da sincronização
- **WHEN** o estado da sessão chega com o status em texto
- **THEN** a aplicação SHALL convertê-lo para a mesma representação usada nas demais telas

### Requirement: Exportação de relatório entregue ao navegador
A exportação do relatório SHALL solicitar o formato escolhido à API, tratar a resposta como arquivo e entregá-la ao navegador como download, com nome de arquivo que identifique a sessão. Erro na exportação SHALL ser exibido como qualquer outro erro de API.

#### Scenario: Exportação concluída
- **WHEN** o apresentador escolhe exportar em CSV ou JSON
- **THEN** o arquivo devolvido pela API SHALL ser baixado com nome que identifique a sessão

#### Scenario: Exportação recusada
- **WHEN** a API recusa a exportação
- **THEN** a mensagem devolvida SHALL ser exibida e nenhum download SHALL ocorrer
