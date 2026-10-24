import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pack from './pack/pack.js';
import devApi from './dev/api-plugin.js';

export default defineConfig({
  plugins: [
    react(),
    devApi(),
    {
      name: 'pack-html',
      transformIndexHtml: html => html
        .replaceAll('%THEME%', pack.colors.primary)
        .replaceAll('%TITLE%', pack.appName)
        .replaceAll('%APPNAME%', pack.shortName)
        .replaceAll('%DESC%', `${pack.unit} · ${pack.place}. ${pack.tagline}`),
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/*'],
      manifest: {
        name: pack.appName,
        short_name: pack.shortName,
        description: `${pack.unit} · ${pack.place}. ${pack.tagline}`,
        start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
        theme_color: pack.colors.primary, background_color: '#F6F3EA', lang: 'en',
        icons: [
          { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2}', 'brand/*.{png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          { urlPattern: /\/api\/photos\/[^/]+(\/thumb)?\?/, handler: 'CacheFirst', options: { cacheName: 'photos', expiration: { maxEntries: 400, maxAgeSeconds: 86400 * 14 } } },
        ],
      },
    }),
  ],
});
