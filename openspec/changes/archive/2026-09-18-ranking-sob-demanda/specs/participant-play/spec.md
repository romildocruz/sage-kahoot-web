## ADDED Requirements

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
