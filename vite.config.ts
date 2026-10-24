import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // the TV opens the screen by the Mac's network name (see screenUrl in server/index.ts)
    allowedHosts: ['.local'],
    proxy: {
      '/socket.io': { target: 'http://localhost:3000', ws: true },
      '/api': 'http://localhost:3000',
    },
  },
  build: { outDir: 'dist' },
});
