// Aplica o tema salvo antes do render para evitar flash (FOUC).
// Externo (não inline) para a CSP poder usar script-src 'self' sem
// 'unsafe-inline'. Carregado de forma síncrona no <head>, roda antes do paint.
try {
  document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark'
} catch (e) {
  document.documentElement.dataset.theme = 'dark'
}
