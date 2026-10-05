## ADDED Requirements

### Requirement: Ranking corrente obtido na sincronização
Sempre que o telão sincronizar o estado com o servidor — conexão inicial, reconexão ou recarregamento da página —, a aplicação SHALL consultar o ranking corrente da sessão e exibi-lo. A consulta MUST NOT substituir o ranking recebido por evento durante a sessão, e sua falha MUST NOT impedir a exibição do estado sincronizado.

#### Scenario: Recarregamento entre perguntas
- **WHEN** o apresentador recarrega o telão entre duas perguntas
- **THEN** o ranking parcial SHALL ser exibido sem esperar o próximo evento de atualização de ranking

#### Scenario: Falha ao consultar o ranking
- **WHEN** a consulta do ranking falha
- **THEN** a tela SHALL continuar exibindo o estado sincronizado
- **AND** o ranking SHALL ser preenchido quando chegar a próxima atualização por evento

## MODIFIED Requirements

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
