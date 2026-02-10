import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/midi-colab/index.ts'),
      name: 'MidiColab',
      fileName: (format) => `midi-colab.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'yjs', 'y-websocket', 'webmidi', 'tonal', '@webcontainer/api'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'yjs': 'Y',
          'y-websocket': 'yWebsocket',
          'webmidi': 'WebMIDI',
          'tonal': 'Tonal',
          '@webcontainer/api': 'WebContainer'
        }
      }
    },
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true
  }
})