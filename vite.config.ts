/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Controle de Desperdício — Petiscaria',
        short_name: 'Desperdício',
        description:
          'Registro e acompanhamento do desperdício de alimentos da petiscaria.',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
