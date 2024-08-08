import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: '../src/public',
    emptyOutDir: true,
    assetsDir: 'static',
    rollupOptions: {
      output: {
        entryFileNames: 'app/[name].js',
        chunkFileNames: 'app/[name].js',
        assetFileNames: 'app/[name].[ext]',
      },
    },
  },
  plugins: [react()],
})
