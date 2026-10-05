# Uma réplica no Deployment do sage-kahoot-web

## Why

O manifest publicava 2 réplicas do frontend, justificadas por sobrevivência ao reinício de um nó. Para a escala real de uso — dezenas de participantes por sessão, uso interno — uma réplica basta, e o ambiente local de desenvolvimento já roda assim. Manter os dois alinhados evita que o manifest do repositório e o que de fato roda divirjam.

## What Changes

- `deploy/k8s/k8sdeploy.yml`: `replicas: 2` → `replicas: 1` no Deployment `sage-kahoot-web`, com o comentário atualizado.
- Nada mais muda: imagem, Service, Ingress, ConfigMap, securityContext, probes e estratégia de atualização ficam como estão.

## Capabilities

**New Capabilities**: nenhuma.

**Modified Capabilities**: nenhuma — por isso `skip_specs: true`.

A capability `web-platform` exige que o deployment **admita** mais de uma réplica e atualização progressiva sem indisponibilidade; ela não fixa contagem de réplicas. Com `replicas: 1` as duas coisas continuam valendo: escalar segue livre, e no rollout o padrão de `maxUnavailable` (25%) arredonda para 0 enquanto `maxSurge` arredonda para 1, então o pod novo sobe antes de o antigo sair. Não há requisito para alterar, e inventar um só para satisfazer validação seria pior que declarar a ausência de delta.

## Impact

- Deploy: uma réplica a menos do frontend no cluster interno. Perde-se a folga de um pod já em execução durante a falha de um nó; o pod é recriado normalmente pelo scheduler.
- Sem impacto em código, contrato, configuração ou no deployment da sage-kahoot-api.
- Reversível por edição do manifest ou por `kubectl scale`, sem rebuild de imagem.
