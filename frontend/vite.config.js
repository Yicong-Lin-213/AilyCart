import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { qrcode } from 'vite-plugin-qrcode'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl(), qrcode()],
  // server: { https: true, host: true}
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
