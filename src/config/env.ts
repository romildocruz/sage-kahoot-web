/**
 * Configuração de ambiente. Tudo que muda entre dev/homolog/produção interna entra aqui — nenhum
 * componente lê `import.meta.env` nem `window` diretamente.
 *
 * O build de um SPA é estático, mas a URL da API não pode ficar presa na imagem: `public/config.js`
 * é regravado no start do container a partir das variáveis do pod (ConfigMap), então a mesma imagem
 * serve todos os ambientes. As variáveis `VITE_*` continuam valendo como padrão de desenvolvimento.
 */
type RuntimeConfig = {
  apiBaseUrl?: string
  joinUrlBase?: string
}

declare global {
  interface Window {
    __SAGE_KAHOOT_CONFIG__?: RuntimeConfig
  }
}

const runtime = window.__SAGE_KAHOOT_CONFIG__ ?? {}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const rawBaseUrl = (runtime.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '').trim()

/**
 * Base das rotas REST, sem barra no final. Vazio significa mesma origem — é o modo usado em
 * desenvolvimento (proxy do Vite) e quando a API é publicada sob o mesmo host.
 */
export const apiBaseUrl = trimTrailingSlash(rawBaseUrl)

/** Caminho do hub; fixado pela API em `AuthSetup.HubPath`. */
export const hubPath = '/hubs/quiz'

export const hubUrl = `${apiBaseUrl}${hubPath}`

/** Endereço que o apresentador projeta para o participante entrar. */
export const joinUrlBase = trimTrailingSlash(
  (runtime.joinUrlBase || import.meta.env.VITE_JOIN_URL_BASE || window.location.origin).trim(),
)
