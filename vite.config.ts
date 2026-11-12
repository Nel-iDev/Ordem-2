import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// No GitHub Pages de projeto o app fica em /<nome-do-repo>/, então o build
// precisa gerar caminhos com esse prefixo. Defina VITE_BASE="/" para publicar
// em domínio próprio ou na raiz de um usuário/organização.
const base = process.env.VITE_BASE ?? '/Ordem-2/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? base : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
}))
