import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
          ],
          'audio-lame': ['@breezystack/lamejs'],
          'audio-muxer': ['mp4-muxer'],
        },
      },
    },
  },
});
