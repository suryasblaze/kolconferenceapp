import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/kolconferenceapp/', // For GitHub Pages deployment
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild' // Use esbuild (default, faster) instead of terser
  }
})
