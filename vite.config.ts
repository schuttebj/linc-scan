import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    https: true  // Enable HTTPS for camera access
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})