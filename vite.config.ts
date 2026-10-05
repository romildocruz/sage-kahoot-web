import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Em desenvolvimento o Vite faz proxy de `/api` e `/hubs` para a sage-kahoot-api, então o app roda
 * com URL relativa (`VITE_API_BASE_URL` vazio) e não depende da lista de origens do CORS da API.
 * O proxy do hub precisa de `ws: true` — o SignalR sobe para WebSocket.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.DEV_API_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/hubs': { target, changeOrigin: true, ws: true },
      },
    },
    build: {
      sourcemap: mode !== 'production',
    },
  }
})
