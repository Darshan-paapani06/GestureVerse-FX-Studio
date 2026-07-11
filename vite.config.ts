import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.{svg,png}', 'audio/*.wav'],
      manifest: {
        name: 'GestureVerse FX Studio',
        short_name: 'GestureVerse',
        description: 'AI-powered real-time gesture controlled cinematic VFX studio.',
        theme_color: '#050816',
        background_color: '#03040a',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,wav,task,tflite,wasm,data}'],
        maximumFileSizeToCacheInBytes: 18 * 1024 * 1024
      }
    })
  ],
  server: { port: 5173, host: '0.0.0.0' },
  preview: { port: 4173, host: '0.0.0.0' },
  build: { target: 'es2022', sourcemap: true }
})
