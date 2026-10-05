## Purpose

Descreve como o apresentador entra na superfície administrativa do sage-kahoot-web e como a aplicação guarda, usa e descarta o token emitido pela sage-kahoot-api. O controle de acesso que decide é o da API; aqui o objetivo é não oferecer telas inúteis a quem não tem token válido e não manter credencial além do necessário.

## Requirements

### Requirement: Tela de login do apresentador
A aplicação SHALL expor uma rota pública de login que colete usuário e senha e os envie ao endpoint de login da API. A tela SHALL exibir a mensagem de erro devolvida pela API sem tentar distinguir usuário inexistente de senha incorreta, e SHALL oferecer um caminho visível para a tela de entrada do participante.

#### Scenario: Credencial aceita
- **WHEN** o apresentador envia usuário e senha aceitos pela API
- **THEN** a aplicação SHALL guardar o token, seu instante de expiração e o papel retornados
- **AND** SHALL navegar para a rota administrativa de origem, ou para a lista de quizzes quando não houver origem registrada

#### Scenario: Credencial recusada
- **WHEN** a API responde 401 ao login
- **THEN** a tela SHALL exibir a mensagem devolvida pela API
- **AND** nenhum token SHALL ser guardado

#### Scenario: Erro de validação por campo
- **WHEN** a API responde 400 com erros por campo em `problem+json`
- **THEN** a tela SHALL exibir cada mensagem junto do campo correspondente e marcar o campo como inválido

#### Scenario: Excesso de tentativas
- **WHEN** a API responde 429 por rate limit de login
- **THEN** a tela SHALL exibir a mensagem devolvida e MUST NOT repetir a requisição automaticamente

### Requirement: Guarda das rotas administrativas
As rotas sob `/admin` — exceto a de login — SHALL ser acessíveis apenas quando houver token de apresentador guardado e não expirado. Ao barrar o acesso, a aplicação SHALL registrar a rota pretendida e redirecionar para o login. Esta guarda é conveniência de navegação e MUST NOT ser tratada como controle de segurança: a autorização efetiva é da API.

#### Scenario: Acesso sem token
- **WHEN** um navegador sem token guardado abre uma rota administrativa
- **THEN** a aplicação SHALL redirecionar para a tela de login
- **AND** SHALL registrar a rota pretendida para retomá-la após o login

#### Scenario: Acesso com token válido
- **WHEN** um navegador com token não expirado abre uma rota administrativa
- **THEN** a aplicação SHALL renderizar a rota normalmente

### Requirement: Ciclo de vida do token do apresentador
O token do apresentador SHALL ser persistido no `localStorage`, para sobreviver ao recarregamento e a novas visitas durante a preparação do treinamento. A leitura do token SHALL comparar o instante de expiração com o relógio local e descartar o token vencido antes de qualquer requisição. Nenhum dado além do token, sua expiração e o papel SHALL ser persistido.

#### Scenario: Token expirado ao voltar ao app
- **WHEN** o apresentador reabre a aplicação após o instante de expiração do token
- **THEN** o token SHALL ser descartado do armazenamento
- **AND** as rotas administrativas SHALL redirecionar para o login

#### Scenario: Token rejeitado pela API
- **WHEN** qualquer requisição administrativa recebe 401
- **THEN** o token guardado SHALL ser descartado
- **AND** a próxima navegação administrativa SHALL levar ao login

#### Scenario: Saída explícita
- **WHEN** o apresentador aciona "Sair"
- **THEN** o token SHALL ser removido do armazenamento
- **AND** a aplicação SHALL navegar para a tela de login

### Requirement: Separação entre sessão de apresentador e de participante
A aplicação SHALL manter os tokens de apresentador e de participante em armazenamentos distintos e SHALL enviar cada token apenas às rotas do respectivo público. Um mesmo navegador SHALL poder manter as duas sessões sem que uma interfira na outra.

#### Scenario: Apresentador testa como participante na mesma máquina
- **WHEN** o mesmo navegador tem token de apresentador e entra em uma sessão como participante
- **THEN** as rotas administrativas SHALL continuar usando o token de apresentador
- **AND** as rotas de participante SHALL usar o token de participante
