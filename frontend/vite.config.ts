import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        port: 80,
        proxy: {
            '/api': {
                target: 'http://paint-stand',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://paint-stand',
                changeOrigin: true,
            },
        },
    },
});
