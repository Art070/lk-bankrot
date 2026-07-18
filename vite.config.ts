import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    // The embedded Cyrillic PDF font (robotoFont) is a large but lazily-loaded
    // chunk — it only downloads when a user actually exports a PDF.
    chunkSizeWarningLimit: 1500,
  },
})
