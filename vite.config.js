import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  root: '.',
  base: command === 'build' ? '/Bali-Starling/' : '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 5175,
    open: false,
    strictPort: false,
  },
}));
