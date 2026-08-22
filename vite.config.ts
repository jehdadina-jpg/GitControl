import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      preload: {
        input: path.join(import.meta.dirname, 'electron/preload.ts'),
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                // The plugin's default preload build emits CommonJS syntax but
                // names the file `.mjs` when package.json has `"type": "module"`,
                // which makes Node load it as an ES module — `require` is then
                // undefined and the whole preload script (and contextBridge
                // exposure) silently fails to run. Force a `.cjs` extension so
                // the CJS output is actually interpreted as CJS.
                entryFileNames: 'preload.cjs',
                chunkFileNames: 'preload.cjs',
              },
            },
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
