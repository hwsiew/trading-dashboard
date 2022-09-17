import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    open: true,
    proxy: {
      '/events': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/luno': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
    }
  }
});