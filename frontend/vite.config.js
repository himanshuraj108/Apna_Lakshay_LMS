import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
    const isProd = command === 'build';

    return {
        plugins: [react()],

        // Force a single copy of React at all times.
        // Prevents "useState is null / two copies of React" errors.
        resolve: {
            dedupe: ['react', 'react-dom', 'react-router-dom'],
        },

        // Pre-bundle React together so Vite never creates split React instances.
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'react/jsx-dev-runtime',
                'react-router-dom',
            ],
        },

        server: {
            port: 5173,
            host: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:5000',
                    changeOrigin: true
                }
            }
        },

        build: {
            chunkSizeWarningLimit: 700,
            sourcemap: false,
            minify: 'esbuild',

            rollupOptions: {
                output: {
                    // manualChunks only runs during production builds (command === 'build').
                    // In dev mode this is skipped — dev uses Vite's native module graph
                    // and pre-bundler, which must NOT be overridden or React gets duplicated.
                    ...(isProd ? {
                        manualChunks(id) {
                            if (id.includes('node_modules/react/') ||
                                id.includes('node_modules/react-dom/') ||
                                id.includes('node_modules/react-router-dom/') ||
                                id.includes('node_modules/scheduler/')) {
                                return 'vendor-react';
                            }
                            if (id.includes('node_modules/jspdf') ||
                                id.includes('node_modules/jspdf-autotable')) {
                                return 'vendor-pdf';
                            }
                            if (id.includes('node_modules/html2canvas')) {
                                return 'vendor-canvas';
                            }
                            if (id.includes('node_modules/framer-motion')) {
                                return 'vendor-motion';
                            }
                            if (id.includes('node_modules/katex')) {
                                return 'vendor-katex';
                            }
                            if (id.includes('node_modules/react-icons') ||
                                id.includes('node_modules/lucide-react')) {
                                return 'vendor-icons';
                            }
                            if (id.includes('node_modules/socket.io-client') ||
                                id.includes('node_modules/engine.io-client')) {
                                return 'vendor-socket';
                            }
                            if (id.includes('node_modules/gsap') ||
                                id.includes('node_modules/@gsap')) {
                                return 'vendor-gsap';
                            }
                            if (id.includes('node_modules/qrcode.react') ||
                                id.includes('node_modules/html5-qrcode')) {
                                return 'vendor-qr';
                            }
                        }
                    } : {})
                }
            }
        }
    };
})
