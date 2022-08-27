import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/events': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
