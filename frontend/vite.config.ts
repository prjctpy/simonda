import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
// Backend Django Ninja dijalankan terpisah (python manage.py runserver, port 8000).
// Proxy di bawah membuat /api dan /media terlihat sebagai origin yang sama saat dev,
// jadi tidak perlu konfigurasi CORS tambahan di sisi Django. Isi VITE_API_URL di
// .env.local bila backend berjalan di host/port lain.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const djangoUrl = env.VITE_API_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': { target: djangoUrl, changeOrigin: true },
        '/media': { target: djangoUrl, changeOrigin: true },
      },
    },
  };
});
