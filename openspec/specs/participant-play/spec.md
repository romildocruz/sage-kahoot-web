## Purpose

Descreve a superfície do participante: entrada anônima por PIN e apelido e a tela de jogo no celular. É o caminho de maior volume de uso e o único acessível sem autenticação prévia, então trata-se também da superfície mais exposta a erro de digitação e a oscilação de rede.

## Requirements

### Requirement: Entrada anônima por PIN e apelido
A rota raiz da aplicação SHALL ser a entrada do participante, pedindo apenas PIN e apelido, sem qualquer cadastro. O campo de PIN SHALL aceitar somente dígitos, limitado ao comprimento de 6 do contrato, e SHALL abrir o teclado numérico em dispositivos móveis. O apelido SHALL ser limitado a 40 caracteres. O envio SHALL permanecer bloqueado enquanto o PIN não tiver 6 dígitos ou o apelido estiver vazio.

#### Scenario: Entrada aceita
- **WHEN** o participante envia PIN e apelido aceitos pela API
- **THEN** a aplicação SHALL guardar o token de participante e os dados da sessão
- **AND** SHALL navegar para a tela de jogo

#### Scenario: Caracteres não numéricos no PIN
- **WHEN** o participante digita caracteres não numéricos no campo de PIN
- **THEN** o campo SHALL descartar os caracteres inválidos

#### Scenario: PIN inexistente ou sessão indisponível
- **WHEN** a API recusa a entrada
- **THEN** a tela SHALL exibir a mensagem devolvida pela API
- **AND** o participante SHALL permanecer na tela de entrada com os campos preenchidos

#### Scenario: PIN recebido por link
- **WHEN** a tela é aberta com o PIN na URL
- **THEN** o campo de PIN SHALL vir preenchido com os dígitos informados

### Requirement: Orientação contra dado pessoal real
A tela de entrada SHALL orientar o uso de apelido em vez de nome completo, deixando explícito que a sessão é anônima e vale apenas para aquele treinamento.

#### Scenario: Aviso visível na entrada
- **WHEN** a tela de entrada é exibida
- **THEN** SHALL conter a orientação de usar apelido, e não o nome real

### Requirement: Sessão do participante restrita à aba
O token e os dados da sessão do participante SHALL ser guardados em armazenamento de escopo de aba, não compartilhado com outras abas e descartado ao fim da sessão do navegador. A tela de jogo SHALL exigir sessão ativa.

#### Scenario: Acesso direto à tela de jogo sem sessão
- **WHEN** a tela de jogo é aberta sem sessão de participante guardada
- **THEN** a aplicação SHALL redirecionar para a tela de entrada

#### Scenario: Saída ao fim do treinamento
- **WHEN** o participante aciona sair na tela final
- **THEN** a sessão guardada SHALL ser descartada
- **AND** a aplicação SHALL voltar à tela de entrada

### Requirement: Sala de espera do participante
Enquanto a sessão não iniciar, a tela SHALL confirmar que o participante está na sala, exibindo seu apelido, o título do quiz e a orientação de aguardar o apresentador.

#### Scenario: Aguardando início
- **WHEN** a sessão ainda não foi iniciada
- **THEN** a tela SHALL exibir apelido, título do quiz e a instrução de aguardar

### Requirement: Resposta à pergunta aberta
Com uma pergunta aberta, a tela SHALL exibir enunciado, opções e contagem regressiva. Tocar uma opção SHALL registrar a escolha imediatamente na interface e enviá-la à API. A partir do toque, todas as opções SHALL ficar bloqueadas, impedindo segunda resposta. As opções exibidas MUST NOT indicar qual é a correta.

#### Scenario: Resposta enviada
- **WHEN** o participante toca uma opção
- **THEN** a opção SHALL ser destacada como escolhida e as demais atenuadas
- **AND** a resposta SHALL ser enviada à API
- **AND** a tela SHALL confirmar o registro quando a API ou o servidor confirmar o recebimento

#### Scenario: Envio recusado
- **WHEN** a API recusa a resposta
- **THEN** a tela SHALL exibir a mensagem devolvida
- **AND** as opções SHALL voltar a aceitar toque, permitindo nova tentativa enquanto a pergunta estiver aberta

#### Scenario: Tempo esgotado
- **WHEN** a contagem regressiva chega a zero sem resposta enviada
- **THEN** as opções SHALL ficar bloqueadas

#### Scenario: Reconexão com resposta já registrada
- **WHEN** a sincronização informa que a resposta desta pergunta já foi registrada
- **THEN** as opções SHALL permanecer bloqueadas, sem permitir reenvio

### Requirement: Retorno individual ao fim de cada pergunta
Ao receber o resultado da pergunta, a tela SHALL informar se o participante acertou, os pontos ganhos, a pontuação acumulada e a posição, e SHALL destacar sua própria linha no ranking exibido. Nenhuma informação de acerto SHALL ser exibida antes do fechamento da pergunta.

#### Scenario: Resultado recebido
- **WHEN** o servidor envia o resultado individual da pergunta
- **THEN** a tela SHALL exibir acerto ou erro, pontos ganhos, pontuação acumulada e posição

#### Scenario: Fechamento sem resultado individual
- **WHEN** a pergunta é encerrada sem que este participante tenha resultado individual
- **THEN** a tela SHALL informar que a pergunta foi encerrada e orientar a aguardar a próxima

#### Scenario: Destaque no ranking
- **WHEN** o ranking é exibido ao participante
- **THEN** a linha correspondente ao próprio participante SHALL ser destacada

### Requirement: Ranking corrente obtido na sincronização
Sempre que a tela do participante sincronizar o estado com o servidor — conexão inicial, reconexão ou recarregamento —, a aplicação SHALL consultar o ranking corrente da sessão e exibi-lo, com a linha do próprio participante destacada. A consulta SHALL usar o token de participante e a sessão vinculada a ele, e sua falha MUST NOT impedir a exibição do estado sincronizado.

#### Scenario: Reconexão entre perguntas
- **WHEN** o participante reconecta entre duas perguntas
- **THEN** o ranking corrente SHALL ser exibido sem esperar o próximo evento de atualização de ranking

#### Scenario: Entrada na tela após o encerramento
- **WHEN** o participante abre a tela de uma sessão já encerrada
- **THEN** o ranking consultado SHALL vir marcado como final
- **AND** a tela SHALL exibi-lo com o próprio participante destacado

#### Scenario: Falha ao consultar o ranking
- **WHEN** a consulta do ranking falha
- **THEN** a tela SHALL continuar exibindo o estado sincronizado
- **AND** nenhuma mensagem de erro SHALL ser exibida por causa dessa consulta

### Requirement: Tela final do participante
Ao receber o encerramento da sessão, a tela SHALL exibir a posição final e a pontuação final do participante, o ranking informado pelo servidor e a opção de sair.

#### Scenario: Sessão encerrada
- **WHEN** o servidor informa o encerramento ao participante
- **THEN** a tela SHALL exibir posição final, pontuação final e o ranking
