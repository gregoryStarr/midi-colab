import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({&#10;  server: {&#10;    host: true,&#10;    port: 5173,&#10;    strictPort: true,&#10;    https: false&#10;  },
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/midi-colab/index.ts'),
      name: 'MidiColab',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'yjs', 'y-websocket', 'webmidi', 'tonal', '@webcontainer/api'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          yjs: 'Y',
          'y-websocket': 'yWebsocket',
          webmidi: 'WebMIDI',
          tonal: 'Tonal',
          '@webcontainer/api': 'WebContainer'
        }
      }
    },
    target: 'es2020'
  }
})