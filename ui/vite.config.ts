import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const dir = path.dirname(fileURLToPath(import.meta.url))

function resolveWorkspaceDep(pkg: string) {
  const local = path.resolve(dir, 'node_modules', pkg)
  if (fs.existsSync(local)) return local
  return path.resolve(dir, '../node_modules', pkg)
}

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
      react: resolveWorkspaceDep('react'),
      'react-dom': resolveWorkspaceDep('react-dom'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', '@floating-ui/react'],
  },
})
