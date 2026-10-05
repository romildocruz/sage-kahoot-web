/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_JOIN_URL_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
