import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
   server: {
     port: 3000,
     https: {
       key: './localhost+1-key.pem',
       cert: './localhost+1.pem'
     },
     headers: {
       'Cross-Origin-Opener-Policy': 'same-origin',
       'Cross-Origin-Embedder-Policy': 'require-corp'
     }
   },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true
  },
  define: {
    global: 'globalThis'
  }
})