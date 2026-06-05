import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/KT-and-QT/' : '/',
  server: { port: 8080 },
  build: { outDir: 'dist' },
});
