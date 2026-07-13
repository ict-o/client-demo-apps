import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/client-demo-apps/case-monitoring-demo/',
  build: {
    outDir: '.',
    emptyOutDir: false,
  },
})
