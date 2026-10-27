import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Solo desarrollo: /api se reenvía al backend local. Así alcanza con
  // compartir un único puerto (5173), p. ej. con el "Ports" de VS Code.
  server: {
    allowedHosts: ['.devtunnels.ms'],
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  plugins: [
    react(),
    VitePWA({
      // El service worker se actualiza solo en cada deploy nuevo de Vercel.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Floxer — Gestión',
        short_name: 'Floxer',
        description: 'Floxer, panel de gestión interna de Flox: stock, caja y envíos.',
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EDF2F7',
        theme_color: '#16285A',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Solo se precachea el shell estático de la app. Las llamadas a la API
        // (otro origen, con cookie de sesión) nunca se cachean: van siempre a la red.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//], // la API nunca la responde el service worker
      },
    }),
  ],
});
