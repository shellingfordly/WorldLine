/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages project site: https://shellingfordly.github.io/WorldLine/
  base: '/WorldLine/',
  plugins: [react()],
  assetsInclude: ['**/*.md'],
  test: {
    environment: 'node',
  },
})
