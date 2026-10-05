// Configuração de runtime. Em desenvolvimento fica vazia (o Vite faz proxy de /api e /hubs);
// no container, este arquivo é regravado no start a partir das variáveis de ambiente do pod.
window.__SAGE_KAHOOT_CONFIG__ = {
  apiBaseUrl: '',
  joinUrlBase: '',
}
