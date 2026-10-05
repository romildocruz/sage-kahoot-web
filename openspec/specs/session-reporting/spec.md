## Purpose

Descreve as telas de acompanhamento pós-treinamento: histórico de sessões e relatório detalhado de uma sessão, com pódio, ranking e desempenho por pergunta. É o material que o facilitador usa para avaliar a turma depois que a sessão acabou.

## Requirements

### Requirement: Histórico de sessões com filtros
A aplicação SHALL listar as sessões anteriores na ordem devolvida pela API, da mais recente para a mais antiga, com paginação de 20 itens. A lista SHALL exibir PIN, quiz, status, início, fim, quantidade de participantes e maior pontuação, e SHALL oferecer filtro por status e por período.

#### Scenario: Filtro por período
- **WHEN** o apresentador informa data inicial e final
- **THEN** a consulta SHALL cobrir o intervalo completo dos dias informados
- **AND** a paginação SHALL voltar para a primeira página

#### Scenario: Filtro por status
- **WHEN** o apresentador seleciona um status
- **THEN** a consulta SHALL enviar o status à API e a paginação SHALL voltar para a primeira página

#### Scenario: Período sem sessões
- **WHEN** nenhuma sessão atende aos filtros
- **THEN** a tela SHALL informar que não há sessões no período selecionado

### Requirement: Relatório detalhado da sessão
O relatório de uma sessão SHALL exibir a identificação da sessão (PIN, quiz, status), os instantes de início e fim, a quantidade de participantes e a quantidade de perguntas, além do pódio, do ranking completo e do desempenho por pergunta. Quando a API indicar que o relatório ainda não é final, a tela SHALL sinalizar que se trata de resultado parcial.

#### Scenario: Relatório de sessão encerrada
- **WHEN** o relatório de uma sessão encerrada é aberto
- **THEN** a tela SHALL exibir identificação, pódio, ranking completo e desempenho por pergunta

#### Scenario: Relatório ainda não consolidado
- **WHEN** a API indica que o relatório não é final
- **THEN** a tela SHALL exibir indicação visível de resultado parcial

### Requirement: Ranking com desempenho individual
O ranking do relatório SHALL exibir, por participante, posição, apelido, pontuação total, quantidade de acertos, de erros, de perguntas sem resposta e tempo médio de resposta. O pódio SHALL ser montado a partir dos participantes marcados como pódio pela API, sem recalcular a classificação no cliente.

#### Scenario: Participante sem resposta em alguma pergunta
- **WHEN** um participante deixou perguntas sem responder
- **THEN** a linha correspondente SHALL exibir a quantidade de perguntas sem resposta

#### Scenario: Tempo médio indisponível
- **WHEN** não há tempo médio de resposta apurado
- **THEN** a célula correspondente SHALL exibir indicação de ausência de valor, e não zero

### Requirement: Desempenho por pergunta
Para cada pergunta, o relatório SHALL exibir o enunciado na ordem original, a taxa de acerto, o tempo médio de resposta, a quantidade de participantes sem resposta e, por opção, o texto, a marcação da opção correta, a quantidade de respostas e sua participação percentual no total respondido.

#### Scenario: Pergunta sem nenhuma resposta
- **WHEN** nenhuma resposta foi registrada para uma pergunta
- **THEN** a participação percentual de cada opção SHALL ser exibida como zero, sem divisão por zero

#### Scenario: Identificação da opção correta
- **WHEN** as opções de uma pergunta são exibidas
- **THEN** a opção correta SHALL estar marcada de forma explícita

### Requirement: Exportação do relatório
A tela de relatório SHALL oferecer exportação em CSV e em JSON, conforme os formatos aceitos pela API, entregando o arquivo ao navegador como download.

#### Scenario: Exportação em CSV
- **WHEN** o apresentador escolhe exportar em CSV
- **THEN** o arquivo devolvido pela API SHALL ser baixado

#### Scenario: Exportação em JSON
- **WHEN** o apresentador escolhe exportar em JSON
- **THEN** o arquivo devolvido pela API SHALL ser baixado

### Requirement: Relatórios sem dado pessoal real
As telas de relatório SHALL exibir apenas os apelidos informados na entrada da sessão e os números apurados pela API. A aplicação MUST NOT coletar, derivar ou exibir qualquer identificação pessoal adicional dos participantes.

#### Scenario: Identificação do participante no relatório
- **WHEN** um participante aparece no ranking
- **THEN** SHALL ser identificado apenas pelo apelido usado na sessão
