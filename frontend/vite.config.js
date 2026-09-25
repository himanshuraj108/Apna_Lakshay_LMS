import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],

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
        // Increase warning threshold slightly (we'll fix via chunking below)
        chunkSizeWarningLimit: 700,

        // Source maps in prod only for error tracking — turn off for pure perf
        sourcemap: false,

        // Minify with esbuild (default, fastest)
        minify: 'esbuild',

        rollupOptions: {
            output: {
                /**
                 * Manual chunk splitting strategy:
                 * - Keeps vendor libs separate so browsers can cache them independently
                 * - Heavy PDF / canvas libs only load on pages that need them
                 * - React core stays tiny for fast initial parse
                 */
                manualChunks(id) {
                    // ── React core (tiny, always needed) ──────────────────────
                    if (id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react-router-dom/') ||
                        id.includes('node_modules/scheduler/')) {
                        return 'vendor-react';
                    }

                    // ── Heavy PDF / report libs (lazy-split, loaded only on
                    //    AttendanceManagement and FeeManagement pages) ─────────
                    if (id.includes('node_modules/jspdf') ||
                        id.includes('node_modules/jspdf-autotable')) {
                        return 'vendor-pdf';
                    }

                    if (id.includes('node_modules/html2canvas')) {
                        return 'vendor-canvas';
                    }

                    // ── Framer Motion (UI animations) ──────────────────────────
                    if (id.includes('node_modules/framer-motion')) {
                        return 'vendor-motion';
                    }

                    // ── KaTeX (math renderer, student pages only) ──────────────
                    if (id.includes('node_modules/katex')) {
                        return 'vendor-katex';
                    }

                    // ── Icons (react-icons + lucide) ───────────────────────────
                    if (id.includes('node_modules/react-icons') ||
                        id.includes('node_modules/lucide-react')) {
                        return 'vendor-icons';
                    }

                    // ── Socket.io client ───────────────────────────────────────
                    if (id.includes('node_modules/socket.io-client') ||
                        id.includes('node_modules/engine.io-client')) {
                        return 'vendor-socket';
                    }

                    // ── GSAP animation ─────────────────────────────────────────
                    if (id.includes('node_modules/gsap') ||
                        id.includes('node_modules/@gsap')) {
                        return 'vendor-gsap';
                    }

                    // ── QR code ────────────────────────────────────────────────
                    if (id.includes('node_modules/qrcode.react') ||
                        id.includes('node_modules/html5-qrcode')) {
                        return 'vendor-qr';
                    }

                    // ── Misc remaining node_modules → single shared vendor ─────
                    if (id.includes('node_modules/')) {
                        return 'vendor-misc';
                    }
                }
            }
        }
    }
})
