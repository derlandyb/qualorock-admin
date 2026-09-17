import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './visual',
  use: { baseURL: process.env.ADMIN_PANEL_URL ?? 'http://localhost:5174' },
  reporter: [['list']],
})
