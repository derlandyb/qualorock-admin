/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allows the Playwright container to reach the dev server by its
    // docker-compose service name (Vite's dev server otherwise rejects
    // requests with an unrecognized Host header).
    allowedHosts: ['admin-panel'],
  },
  resolve: {
    alias: {
      '@domain': path.resolve(import.meta.dirname, 'src/domain'),
      '@application': path.resolve(import.meta.dirname, 'src/application'),
      '@infrastructure': path.resolve(import.meta.dirname, 'src/infrastructure'),
      '@presentation': path.resolve(import.meta.dirname, 'src/presentation'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Playwright's e2e specs under e2e/ have their own runner (see e2e/playwright.config.ts) —
    // Vitest's default include glob would otherwise also pick them up.
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
