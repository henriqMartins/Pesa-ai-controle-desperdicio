/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  //configurar para pegar porta definida no .env
  server: {
    port: Number(process.env.VITE_PORT) || 3000,
    open: true,
  },
  // Configuração dos testes (Vitest). Roda com `npm test`.
  test: {
    environment: 'jsdom', // simula o navegador (necessário para testar hooks/componentes)
    setupFiles: './src/test/setup.ts',
    // Valores de ambiente fake: evita que src/lib/supabase.ts lance erro ao
    // ser importado durante os testes (ele exige as variáveis VITE_SUPABASE_*).
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registro via arquivo externo (/registerSW.js), não inline — necessário
      // para a CSP com script-src 'self' (ver vercel.json).
      injectRegister: 'script',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Monitor de Desperdício — Petiscaria Aquino',
        short_name: 'Aquino',
        description:
          'Registro e acompanhamento do desperdício de alimentos da Petiscaria Aquino.',
        lang: 'pt-BR',
        // Cores da marca (laranja→vermelho) e fundo escuro do tema padrão —
        // dão a cor da barra de status e da splash ao instalar.
        theme_color: '#f0464e',
        background_color: '#0f0d0b',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          // SVG escalável: nitidez em qualquer tamanho (navegador/desktop).
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          // PNGs: exigidos por Android/Chrome para o ícone instalado.
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Maskable: o SO recorta no formato dele (círculo, squircle) sem cortar o logo.
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
