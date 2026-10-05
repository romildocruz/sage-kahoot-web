# Design — uma réplica no Deployment do web

## Decisão

Reduzir para 1 a contagem declarada de réplicas, mantendo `strategy: RollingUpdate` sem parametrizar `maxUnavailable`/`maxSurge`.

## Por que não fixar maxUnavailable: 0 explicitamente

Com 1 réplica, os padrões do Kubernetes já produzem o comportamento desejado: `maxUnavailable` 25% arredonda para baixo (0) e `maxSurge` 25% arredonda para cima (1). Declarar os dois seria mais explícito, mas é configuração adicional fora do que foi pedido nesta mudança. Fica registrado aqui como candidato, caso o cluster interno use padrões diferentes.

## Alternativas descartadas

- **Manter 2 réplicas e escalar para 1 só no ambiente local**: mantém a divergência entre o manifest do repositório e o que roda, que foi justamente o que motivou a mudança.
- **Remover `replicas` do manifest e deixar o valor ao cluster**: tornaria o número implícito e sujeito a reset em cada `kubectl apply`, sem ganho.
