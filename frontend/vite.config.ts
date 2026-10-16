import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  
  const env = loadEnv(mode, import.meta.dirname, '')

  return {
    server: {
      host: '0.0.0.0',
      port: env.APP_PORT ? Number(env.APP_PORT) : 5173,
      proxy: {
        '^/(health|status)': {
          target: 'http://127.0.0.1:8080',
          changeOrigin: true,
        }
      }
    },
    plugins: [react()],
  }
})
