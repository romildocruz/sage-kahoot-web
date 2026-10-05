## Purpose

Descreve como o sage-kahoot-web consome o hub SignalR da sage-kahoot-api: ciclo de vida da conexão, ingresso no grupo da sessão, reconexão, sincronização de estado e tratamento do tempo. É o contrato que não aparece no OpenAPI e por isso precisa estar descrito aqui, derivado do código do hub da API.

## Requirements

### Requirement: Camada de tempo real isolada
O acesso ao hub SHALL ficar concentrado em uma camada própria, com os contratos de evento e invocação declarados em um único lugar. Componentes de tela MUST NOT criar conexão nem invocar métodos do hub diretamente.

#### Scenario: Tela consome tempo real
- **WHEN** uma tela precisa de eventos da sessão
- **THEN** SHALL usar a camada de tempo real, informando identificador de sessão, token e os tratadores de evento

### Requirement: Conexão autenticada ao hub
A conexão SHALL ser aberta apenas quando houver identificador de sessão e token. O token SHALL ser fornecido por uma função consultada a cada conexão e reconexão, e transportado no formato aceito pela API para o handshake. Sem token, nenhuma conexão SHALL ser aberta.

#### Scenario: Token ausente
- **WHEN** não há token disponível para a superfície
- **THEN** nenhuma conexão SHALL ser aberta e o estado exibido SHALL ser o de tempo real inativo

#### Scenario: Token renovado entre reconexões
- **WHEN** o token guardado muda e ocorre uma reconexão
- **THEN** a reconexão SHALL usar o token vigente no momento da tentativa

### Requirement: Ingresso no grupo da sessão após conectar
Estabelecida a conexão, a aplicação SHALL invocar o ingresso no grupo da sessão e, em seguida, a sincronização de estado, antes de considerar a superfície conectada. O apresentador informa a sessão por parâmetro; o participante usa a sessão vinculada ao próprio token.

#### Scenario: Conexão do apresentador
- **WHEN** o telão conecta ao hub
- **THEN** a aplicação SHALL invocar o ingresso no grupo da sessão exibida
- **AND** SHALL sincronizar o estado antes de exibir a sessão como conectada

#### Scenario: Falha no ingresso
- **WHEN** o servidor recusa o ingresso no grupo
- **THEN** o estado da conexão SHALL passar a falha
- **AND** a mensagem devolvida pelo servidor SHALL ser exibida

### Requirement: Reconexão automática com reingresso
A conexão SHALL usar reconexão automática com intervalos curtos, adequados a uma sessão ao vivo. A cada reconexão bem-sucedida, a aplicação SHALL reinvocar o ingresso no grupo — a conexão nova não herda os grupos anteriores — e SHALL sincronizar o estado novamente.

#### Scenario: Queda momentânea de rede
- **WHEN** a conexão cai e é restabelecida automaticamente
- **THEN** a aplicação SHALL reentrar no grupo da sessão
- **AND** SHALL substituir o estado local pelo estado sincronizado do servidor

#### Scenario: Reconexão em andamento
- **WHEN** a conexão está em processo de reconexão
- **THEN** a interface SHALL indicar o estado de reconexão de forma visível

### Requirement: Estado da conexão sempre visível
Tanto o telão quanto a tela do participante SHALL exibir permanentemente o estado da conexão em tempo real, distinguindo conectado, conectando, reconectando, desconectado e falha. O objetivo é que uma queda de tempo real não seja confundida com ausência de respostas.

#### Scenario: Conexão perdida sem recuperação
- **WHEN** a conexão termina sem reconexão bem-sucedida
- **THEN** a interface SHALL indicar o estado de desconexão e a causa informada, quando houver

### Requirement: Sincronização substitui o estado local
O estado devolvido pela sincronização SHALL substituir o estado local da tela, e não ser mesclado com ele. Ele determina status da sessão, pergunta aberta (quando houver), total de perguntas, contagem de participantes, pontuação própria e se a resposta da pergunta corrente já foi registrada.

#### Scenario: Sincronização sem pergunta aberta
- **WHEN** a sincronização devolve a sessão em andamento sem pergunta aberta
- **THEN** a tela SHALL exibir a fase de intervalo e descartar a pergunta anteriormente exibida

#### Scenario: Sincronização com sessão encerrada
- **WHEN** a sincronização devolve a sessão encerrada ou cancelada
- **THEN** a tela SHALL exibir a fase final

### Requirement: Assinatura única de eventos por conexão
Os tratadores de evento SHALL ser registrados uma única vez por conexão e SHALL despachar sempre para a versão mais recente informada pela tela. Recriar as funções de tratamento a cada renderização MUST NOT derrubar nem duplicar assinaturas.

#### Scenario: Renderização da tela durante a sessão
- **WHEN** a tela renderiza novamente durante uma sessão em andamento
- **THEN** a conexão SHALL ser preservada
- **AND** cada evento SHALL ser entregue uma única vez

#### Scenario: Saída da tela
- **WHEN** a tela de sessão é desmontada
- **THEN** a conexão SHALL ser encerrada

### Requirement: Eventos reconhecidos do hub
A camada de tempo real SHALL reconhecer os eventos publicados pela API: entrada e saída de participante, início da sessão, abertura de pergunta, contagem de respostas, confirmação de resposta, fechamento da pergunta, resultado individual, atualização de ranking, encerramento para o apresentador e encerramento para o participante. Eventos destinados ao apresentador MUST NOT ser esperados pela tela do participante.

#### Scenario: Evento restrito ao apresentador
- **WHEN** o servidor publica o fechamento da pergunta com a resposta correta e a distribuição
- **THEN** somente a tela do apresentador SHALL tratá-lo

#### Scenario: Evento restrito ao participante
- **WHEN** o servidor publica o resultado individual da pergunta
- **THEN** somente a tela do participante SHALL tratá-lo

### Requirement: Tempo ancorado no relógio do servidor
A contagem regressiva exibida SHALL ser ancorada no tempo restante informado pelo servidor, recalculada a cada payload recebido. O relógio local MUST NOT ser comparado com instantes absolutos do servidor para determinar o prazo, e nenhum tempo medido no cliente SHALL ser enviado para fins de pontuação.

#### Scenario: Entrada com pergunta já aberta
- **WHEN** um cliente sincroniza estado no meio de uma pergunta aberta
- **THEN** a contagem exibida SHALL começar do tempo restante informado pelo servidor

#### Scenario: Relógio local adiantado ou atrasado
- **WHEN** o relógio do dispositivo diverge do relógio do servidor
- **THEN** a contagem exibida SHALL continuar derivada do tempo restante informado pelo servidor
