import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{output:{entryFileNames:'assets/aventura.js',chunkFileNames:'assets/capitulo-[name].js',assetFileNames:'assets/[name][extname]'}}}});
