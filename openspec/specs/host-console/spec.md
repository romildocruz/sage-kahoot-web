## Purpose

Descreve o telão do apresentador: a tela projetada durante o treinamento, que exibe o PIN, conduz a sessão pergunta a pergunta e mostra a revelação da resposta, o ranking e o pódio. É a superfície que traduz os eventos do hub em algo legível a distância.

## Requirements

### Requirement: Telão em tela cheia, fora da navegação administrativa
O telão SHALL ocupar a tela inteira, sem a barra de navegação das demais telas administrativas, e SHALL exibir permanentemente o título do quiz, o total de participantes e o estado da conexão em tempo real.

#### Scenario: Abertura do telão
- **WHEN** o apresentador abre a rota de uma sessão
- **THEN** a tela SHALL renderizar sem a navegação administrativa
- **AND** SHALL exibir título do quiz, contagem de participantes e indicador de conexão

### Requirement: Metadados da sessão resistentes a recarregamento
O telão SHALL obter PIN, título do quiz e status da sessão a partir da API, e não apenas do estado de navegação, de modo que recarregar a página no meio do treinamento não perca a identificação da sessão.

#### Scenario: Recarregamento do telão
- **WHEN** o apresentador recarrega a página do telão durante a sessão
- **THEN** o PIN e o título do quiz SHALL voltar a ser exibidos
- **AND** o estado corrente da sessão SHALL ser restabelecido pela sincronização com o servidor

### Requirement: Sala de espera com PIN e entrada de participantes
Enquanto a sessão estiver aguardando, o telão SHALL exibir o PIN em tamanho legível a distância, formatado em dois blocos de três dígitos, junto do endereço em que o participante entra. Cada participante que entra SHALL aparecer na tela, e o total exibido SHALL acompanhar as entradas e saídas informadas pelo servidor.

#### Scenario: Participante entra na sala
- **WHEN** o servidor informa a entrada de um participante
- **THEN** o apelido SHALL aparecer na sala de espera
- **AND** o total de participantes SHALL ser atualizado com o valor informado pelo servidor

#### Scenario: Participante sai da sala
- **WHEN** o servidor informa a saída de um participante
- **THEN** o apelido SHALL deixar de ser exibido
- **AND** o total de participantes SHALL ser atualizado com o valor informado pelo servidor

#### Scenario: Início bloqueado sem participantes
- **WHEN** nenhum participante entrou ainda
- **THEN** o controle de iniciar o quiz SHALL estar desabilitado com a explicação correspondente

### Requirement: Condução da sessão pelo apresentador
O telão SHALL oferecer os comandos de iniciar a sessão, avançar e encerrar. O rótulo do comando de avanço SHALL distinguir encerrar a pergunta aberta de abrir a próxima. O encerramento manual da sessão SHALL exigir confirmação explícita. Enquanto um comando estiver em andamento, os comandos SHALL permanecer desabilitados para evitar disparo duplicado.

#### Scenario: Início do quiz
- **WHEN** o apresentador aciona iniciar com ao menos um participante presente
- **THEN** a aplicação SHALL enviar o comando de início à API
- **AND** a tela SHALL passar a exibir a pergunta somente quando o evento de abertura chegar do servidor

#### Scenario: Encerramento da pergunta aberta
- **WHEN** há pergunta aberta e o apresentador aciona o avanço
- **THEN** o comando enviado SHALL ser o de avançar
- **AND** a revelação SHALL ser exibida somente quando o evento de fechamento chegar do servidor

#### Scenario: Encerramento da sessão
- **WHEN** o apresentador confirma o encerramento da sessão
- **THEN** a aplicação SHALL enviar o comando de encerrar à API

#### Scenario: Comando recusado pela API
- **WHEN** a API recusa um comando por conflito de estado
- **THEN** a tela SHALL exibir a mensagem devolvida
- **AND** o estado exibido MUST NOT ser alterado pelo erro

### Requirement: Estado da tela dirigido pelos eventos do servidor
O telão MUST NOT deduzir a mudança de fase a partir da resposta do comando enviado: cada transição SHALL vir do evento correspondente do hub ou da sincronização de estado. A sincronização SHALL substituir o estado local, inclusive descartando a revelação anterior quando o servidor informar que não há pergunta aberta.

#### Scenario: Sincronização entre perguntas
- **WHEN** a sincronização devolve a sessão em andamento sem pergunta aberta
- **THEN** a tela SHALL exibir a fase de intervalo com o ranking parcial
- **AND** a revelação da pergunta anterior MUST NOT continuar visível

#### Scenario: Contagem de respostas de pergunta antiga
- **WHEN** chega uma contagem de respostas referente a uma pergunta que não é a exibida
- **THEN** o contador exibido MUST NOT ser alterado

### Requirement: Exibição da pergunta aberta
Com uma pergunta aberta, o telão SHALL exibir o enunciado, a posição da pergunta no total, as opções e a contagem regressiva, além de quantos participantes já responderam em relação ao total presente. As opções exibidas MUST NOT indicar qual é a correta enquanto a pergunta estiver aberta.

#### Scenario: Pergunta em andamento
- **WHEN** o servidor abre uma pergunta
- **THEN** a tela SHALL exibir enunciado, opções, índice da pergunta e contagem regressiva
- **AND** nenhuma marcação de resposta correta SHALL ser exibida

#### Scenario: Acompanhamento das respostas
- **WHEN** o servidor informa nova contagem de respostas da pergunta exibida
- **THEN** a tela SHALL atualizar quantos responderam em relação ao total de participantes

### Requirement: Revelação da resposta e ranking parcial
Ao receber o fechamento da pergunta, o telão SHALL destacar a opção correta, atenuar as demais e exibir a quantidade de respostas por opção. Entre perguntas, SHALL exibir o ranking parcial informado pelo servidor.

#### Scenario: Fechamento da pergunta
- **WHEN** o servidor informa o fechamento com a opção correta e a distribuição
- **THEN** a opção correta SHALL ser destacada e as demais atenuadas
- **AND** cada opção SHALL exibir a quantidade de respostas recebidas

#### Scenario: Ranking parcial
- **WHEN** o servidor atualiza o ranking durante a sessão
- **THEN** o telão SHALL exibir as primeiras posições com apelido e pontuação

### Requirement: Ranking corrente obtido na sincronização
Sempre que o telão sincronizar o estado com o servidor — conexão inicial, reconexão ou recarregamento da página —, a aplicação SHALL consultar o ranking corrente da sessão e exibi-lo. A consulta MUST NOT substituir o ranking recebido por evento durante a sessão, e sua falha MUST NOT impedir a exibição do estado sincronizado.

#### Scenario: Recarregamento entre perguntas
- **WHEN** o apresentador recarrega o telão entre duas perguntas
- **THEN** o ranking parcial SHALL ser exibido sem esperar o próximo evento de atualização de ranking

#### Scenario: Falha ao consultar o ranking
- **WHEN** a consulta do ranking falha
- **THEN** a tela SHALL continuar exibindo o estado sincronizado
- **AND** o ranking SHALL ser preenchido quando chegar a próxima atualização por evento

### Requirement: Tela final com pódio
Ao receber o encerramento da sessão, o telão SHALL exibir o pódio com as três primeiras posições, seguido das demais colocações, e SHALL oferecer acesso direto ao relatório da sessão. O pódio SHALL ser exibido também quando o telão for aberto ou recarregado após o encerramento, a partir do ranking corrente marcado como final pelo servidor, sem depender de ter recebido o evento de fim de sessão.

#### Scenario: Sessão encerrada
- **WHEN** o servidor informa o ranking final
- **THEN** a tela SHALL exibir o pódio e as demais colocações
- **AND** SHALL oferecer navegação para o relatório daquela sessão

#### Scenario: Telão aberto após o encerramento
- **WHEN** o telão de uma sessão já encerrada é aberto ou recarregado
- **THEN** o ranking consultado SHALL vir marcado como final
- **AND** a tela SHALL exibir o pódio a partir dele

#### Scenario: Sessão sem pontuação
- **WHEN** o ranking final não tem nenhuma entrada
- **THEN** a tela SHALL informar que nenhum participante pontuou, sem exibir pódio vazio
