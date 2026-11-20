import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss()
  ],
  // in development the app runs on Vite and the API on port 3000; the proxy makes them one origin,
  // like in production where Express serves the built app
  server: {
      proxy: {
          '/api': 'http://localhost:3000',
          '/socket.io': {target: 'http://localhost:3000', ws: true}
      }
  },
  test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
  },
})
