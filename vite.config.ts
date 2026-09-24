import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

function inlineCssPlugin(): Plugin {
  return {
    name: 'inline-css-plugin',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;
      let newHtml = html;
      for (const [fileName, file] of Object.entries(ctx.bundle)) {
        if (fileName.endsWith('.css') && file.type === 'asset') {
          const cssContent = typeof file.source === 'string' ? file.source : file.source.toString();
          const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linkRegex = new RegExp(`<link[^>]+href="[^"]*${escapedFileName}"[^>]*>`, 'g');
          newHtml = newHtml.replace(linkRegex, '');
          newHtml = newHtml.replace('</head>', `<style>${cssContent}</style></head>`);
        }
      }
      return newHtml;
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), basicSsl(), inlineCssPlugin()],
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
    outDir: isSsrBuild ? 'dist-ssr' : 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-baseui': ['@base-ui/react/slider', '@base-ui/react/switch'],
              'audio-lame': ['@breezystack/lamejs'],
              'audio-muxer': ['mp4-muxer'],
            },
          },
        },
  },
}));
