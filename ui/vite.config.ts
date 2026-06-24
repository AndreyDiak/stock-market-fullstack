import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(dir, 'node_modules/react'),
      'react-dom': path.resolve(dir, 'node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
})
