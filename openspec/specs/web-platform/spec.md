## Purpose

Descreve as características transversais da aplicação web: organização das rotas, configuração por ambiente, empacotamento e publicação no cluster interno. São as decisões que permitem a mesma imagem servir todos os ambientes e o app ser acessível por celular na rede interna.

## Requirements

### Requirement: Duas superfícies na mesma aplicação
A aplicação SHALL servir a superfície do participante na raiz e a do apresentador sob um prefixo administrativo, em um único build e um único deployment. Rota desconhecida SHALL levar à entrada do participante, por ser o endereço divulgado no telão.

#### Scenario: Endereço divulgado no telão
- **WHEN** um participante abre o endereço raiz da aplicação
- **THEN** a tela de entrada por PIN SHALL ser exibida

#### Scenario: Rota inexistente
- **WHEN** uma rota desconhecida é aberta
- **THEN** a aplicação SHALL redirecionar para a entrada do participante

### Requirement: Configuração resolvida em runtime
A origem da API e o endereço de entrada exibido no telão SHALL ser resolvidos em tempo de execução, a partir de um arquivo de configuração gerado na inicialização do contêiner com as variáveis do ambiente, com as variáveis de build como padrão de desenvolvimento. A mesma imagem SHALL servir todos os ambientes, sem rebuild para trocar de host. A leitura de configuração SHALL ficar concentrada em um único módulo.

#### Scenario: Troca de ambiente
- **WHEN** a mesma imagem é publicada com outra origem de API configurada
- **THEN** a aplicação SHALL passar a chamar a nova origem sem novo build

#### Scenario: Origem não configurada
- **WHEN** nenhuma origem de API é configurada
- **THEN** as chamadas SHALL usar caminho relativo, assumindo API na mesma origem do frontend

#### Scenario: Endereço de entrada não configurado
- **WHEN** nenhum endereço de entrada é configurado
- **THEN** o telão SHALL exibir a própria origem do frontend

### Requirement: Nenhum segredo no frontend
O build e a configuração de runtime MUST NOT conter credencial, chave ou segredo de qualquer natureza — o bundle de uma aplicação de página única é público por definição. A credencial do apresentador SHALL permanecer exclusivamente no Secret consumido pela API.

#### Scenario: Configuração do deployment
- **WHEN** o deployment do frontend é definido
- **THEN** SHALL usar apenas ConfigMap, sem Secret associado

### Requirement: Desenvolvimento sem depender de CORS
O servidor de desenvolvimento SHALL encaminhar as rotas REST e a rota do hub para a API configurada, com suporte a WebSocket, de modo que o desenvolvimento não dependa de a origem local estar na lista de origens permitidas da API.

#### Scenario: Desenvolvimento local
- **WHEN** a aplicação roda em modo de desenvolvimento
- **THEN** as chamadas REST e a conexão do hub SHALL ser encaminhadas para a API configurada

### Requirement: Publicação de conteúdo estático
A imagem SHALL servir o conteúdo estático por um servidor web sem privilégios, executando como usuário não-root, com verificação de saúde própria, resposta de fallback para as rotas da aplicação de página única e política de cache que preserve os arquivos versionados por hash e impeça o cache do documento inicial e do arquivo de configuração de runtime.

#### Scenario: Rota da aplicação aberta diretamente
- **WHEN** uma rota interna da aplicação é aberta diretamente no navegador
- **THEN** o servidor SHALL devolver o documento inicial e o roteamento SHALL ocorrer no cliente

#### Scenario: Verificação de saúde
- **WHEN** o cluster consulta o endpoint de saúde do contêiner
- **THEN** o servidor SHALL responder sucesso sem registrar a consulta no log de acesso

#### Scenario: Nova versão publicada
- **WHEN** uma versão nova é publicada
- **THEN** o documento inicial e o arquivo de configuração MUST NOT ser servidos de cache

### Requirement: Cabeçalhos de defesa no servidor web
As respostas SHALL incluir política de segurança de conteúdo que restrinja as origens de conexão à própria origem e à origem configurada da API, nas variantes HTTP e WebSocket, além dos cabeçalhos de proteção contra sniffing de tipo, enquadramento em frame e vazamento de referenciador.

#### Scenario: Origem de API configurada
- **WHEN** uma origem de API é configurada
- **THEN** a política SHALL permitir conexão a essa origem em HTTP e em WebSocket

#### Scenario: Tentativa de enquadramento
- **WHEN** a aplicação é carregada dentro de um frame de outra página
- **THEN** o carregamento SHALL ser negado pelos cabeçalhos de defesa

### Requirement: Deployment no cluster interno
Os manifests SHALL publicar a aplicação sem exposição pública, acessível pela rede interna, com contêiner não-root, sistema de arquivos raiz somente leitura e volumes temporários para o que o servidor web precisa gravar. Por servir apenas conteúdo estático e não manter estado, o deployment SHALL admitir mais de uma réplica e atualização progressiva — a restrição de instância única aplica-se à API, que hospeda o hub.

#### Scenario: Atualização da aplicação web
- **WHEN** uma versão nova do frontend é publicada
- **THEN** a atualização SHALL poder ser progressiva, sem indisponibilidade

#### Scenario: Sistema de arquivos somente leitura
- **WHEN** o contêiner inicia com raiz somente leitura
- **THEN** a configuração de runtime e os temporários do servidor web SHALL ser gravados em volumes temporários montados

### Requirement: Interface em português do Brasil e responsiva
A interface SHALL ser apresentada em português do Brasil, com datas, horas e números formatados nesse padrão. A superfície do participante SHALL ser projetada para uso em celular e a do apresentador para projeção, respeitando a preferência do sistema por redução de movimento.

#### Scenario: Formatação de data e pontuação
- **WHEN** datas e pontuações são exibidas
- **THEN** SHALL seguir o formato de português do Brasil

#### Scenario: Preferência por redução de movimento
- **WHEN** o sistema do usuário indica preferência por redução de movimento
- **THEN** as animações da interface SHALL ser suprimidas
