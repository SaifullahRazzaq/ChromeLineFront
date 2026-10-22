import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = 'http://localhost:5001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': target,
      '/uploads': target,
      '/socket.io': { target, ws: true },
    },
  },
})
