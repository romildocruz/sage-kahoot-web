## Purpose

Descreve a superfície de criação e manutenção do banco de quizzes usada pelo apresentador: listagem, filtro, edição de perguntas e opções, duplicação e exclusão. As regras que valem são as da API; a tela espelha os limites do contrato apenas para dar retorno imediato antes do envio.

## Requirements

### Requirement: Listagem paginada de quizzes
A aplicação SHALL listar os quizzes com paginação de 20 itens por página, exibindo título, descrição, quantidade de perguntas e instante da última atualização. A listagem SHALL oferecer filtro por título e SHALL preservar a ordem devolvida pela API, sem reordenar no cliente.

#### Scenario: Lista com resultados
- **WHEN** a API devolve uma página de quizzes
- **THEN** a tela SHALL exibir uma linha por quiz com título, quantidade de perguntas e data de atualização
- **AND** SHALL exibir os controles de página quando houver mais de uma página

#### Scenario: Lista vazia
- **WHEN** a API devolve nenhum quiz para o filtro aplicado
- **THEN** a tela SHALL exibir mensagem orientando a criação do primeiro quiz

#### Scenario: Filtro por título
- **WHEN** o apresentador aplica um filtro por título
- **THEN** a consulta SHALL voltar para a primeira página e enviar o título como parâmetro de busca à API

### Requirement: Editor de quiz com o agregado completo
O editor SHALL trabalhar com o quiz inteiro — título, descrição e lista completa de perguntas — porque a atualização no contrato substitui o agregado. Ao abrir um quiz existente, o formulário SHALL ser preenchido com as perguntas ordenadas pelo campo de ordem devolvido pela API; ao salvar, a ordem enviada SHALL ser a ordem exibida na tela.

#### Scenario: Abertura de quiz existente
- **WHEN** o apresentador abre um quiz para edição
- **THEN** o formulário SHALL exibir título, descrição e as perguntas na ordem devolvida pela API, cada uma com suas opções e a marcação da correta

#### Scenario: Reordenação de perguntas
- **WHEN** o apresentador move uma pergunta para cima ou para baixo e salva
- **THEN** a requisição SHALL enviar as perguntas na nova ordem

#### Scenario: Criação concluída
- **WHEN** um quiz novo é criado com sucesso
- **THEN** a aplicação SHALL navegar para a edição do quiz recém-criado, substituindo a entrada de histórico

### Requirement: Limites de entrada espelhados do contrato
O editor SHALL espelhar os limites declarados no contrato OpenAPI: título até 120 caracteres, descrição até 500, enunciado até 300, texto de opção até 120, tempo limite entre 5 e 120 segundos e pontuação base entre 100 e 2000. Os padrões de nova pergunta SHALL ser 20 segundos e 1000 pontos. O editor SHALL sugerir no máximo 4 opções por pergunta e SHALL impedir a remoção abaixo de 2 opções.

#### Scenario: Campo no limite máximo
- **WHEN** o apresentador digita além do limite de caracteres de um campo
- **THEN** o campo SHALL truncar a entrada no limite do contrato

#### Scenario: Remoção da segunda opção
- **WHEN** uma pergunta tem exatamente 2 opções
- **THEN** o controle de remover opção SHALL estar desabilitado

#### Scenario: Limite de opções sugerido
- **WHEN** uma pergunta atinge 4 opções
- **THEN** o controle de adicionar opção SHALL estar desabilitado

### Requirement: Validação local antes do envio
Antes de enviar, a aplicação SHALL validar que o título está preenchido, que cada pergunta tem enunciado, que cada pergunta tem ao menos 2 opções preenchidas e que exatamente uma opção preenchida está marcada como correta. Falhando qualquer verificação, a requisição MUST NOT ser enviada e a mensagem SHALL aparecer junto do item correspondente. Esta validação é conveniência de UI e não substitui a da API.

#### Scenario: Pergunta sem opção correta
- **WHEN** o apresentador salva com uma pergunta sem opção correta marcada
- **THEN** a tela SHALL exibir a mensagem na pergunta correspondente
- **AND** nenhuma requisição de gravação SHALL ser enviada

#### Scenario: Erro de validação vindo da API
- **WHEN** a API recusa a gravação com 400 e erros por campo
- **THEN** a tela SHALL exibir as mensagens devolvidas pela API junto dos campos correspondentes

### Requirement: Quiz vinculado a sessão ativa
Quando a API recusar a alteração de um quiz com 409 por existir sessão ativa vinculada, a aplicação SHALL exibir mensagem explicando que a sessão precisa ser encerrada antes de salvar, e SHALL manter o formulário preenchido para nova tentativa.

#### Scenario: Conflito ao salvar
- **WHEN** a API responde 409 ao salvar um quiz
- **THEN** a tela SHALL exibir a explicação sobre a sessão ativa
- **AND** as alterações digitadas SHALL permanecer no formulário

### Requirement: Duplicação e exclusão de quiz
A listagem SHALL oferecer duplicar e excluir. A duplicação SHALL produzir uma cópia independente e atualizar a listagem. A exclusão SHALL exigir confirmação explícita, cujo texto informa que os relatórios de sessões encerradas continuam disponíveis.

#### Scenario: Exclusão confirmada
- **WHEN** o apresentador confirma a exclusão de um quiz
- **THEN** a aplicação SHALL chamar a exclusão na API e atualizar a listagem

#### Scenario: Exclusão cancelada
- **WHEN** o apresentador cancela a confirmação
- **THEN** nenhuma requisição SHALL ser enviada

### Requirement: Abertura de sessão a partir de um quiz
A listagem SHALL permitir abrir uma sessão ao vivo para um quiz. A ação SHALL estar desabilitada para quiz sem perguntas, com explicação visível. Após a abertura, a aplicação SHALL navegar para o telão da sessão criada.

#### Scenario: Quiz sem perguntas
- **WHEN** o quiz não tem nenhuma pergunta
- **THEN** o controle de iniciar sessão SHALL estar desabilitado com a explicação correspondente

#### Scenario: Sessão aberta
- **WHEN** a API cria a sessão e devolve seu identificador
- **THEN** a aplicação SHALL navegar para o telão daquela sessão
