import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': {
      target: process.env.VITE_API_URL || 'http://192.168.50.181:3000',

        changeOrigin: true,
      },
    },
  },
});
