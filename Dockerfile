# Build
FROM node:24-alpine AS build
WORKDIR /src

# Instalação em camada própria: mudança de código não invalida o cache de pacotes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime — nginx sem privilégios: escuta em 8080 e já roda como usuário não-root.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx/security-headers.inc.template /etc/nginx/templates/security-headers.inc.template
COPY deploy/nginx/05-runtime-config.envsh /docker-entrypoint.d/05-runtime-config.envsh
COPY --from=build /src/dist /usr/share/nginx/html

# O arquivo é sourced pelo entrypoint; a permissão de execução evita depender do modo vindo do host.
USER root
RUN chmod +x /docker-entrypoint.d/05-runtime-config.envsh

# UID numérico, não o nome do usuário: com `runAsNonRoot: true` o kubelet precisa verificar que o
# usuário da imagem não é root antes de iniciar o contêiner, e não resolve nome — um USER nginx faz
# o pod falhar com CreateContainerConfigError. 101 é o uid do usuário nginx na imagem base.
USER 101

EXPOSE 8080
