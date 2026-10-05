# Tarefas — uma réplica no Deployment do web

Mudança aprovada pelo solicitante e aplicada em seguida, no mesmo turno.

## 1. Manifest

- [x] 1.1 Alterar `replicas: 2` para `replicas: 1` no Deployment `sage-kahoot-web` (`deploy/k8s/k8sdeploy.yml`)
- [x] 1.2 Atualizar o comentário: a restrição de instância única é da API, e o rollout segue sem indisponibilidade mesmo com 1 réplica
- [x] 1.3 Conferir que nenhum outro campo do manifest mudou

## 2. Verificação

- [x] 2.1 `kubectl apply --dry-run=server` do manifest renderizado, sem erro
- [x] 2.2 Cluster local já rodando com 1 pod do web e a aplicação respondendo pelo Ingress
