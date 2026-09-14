import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * useLenis — initializes Lenis smooth scroll on a component.
 * Automatically cleans up on unmount.
 * @param {boolean} enabled - set false to disable (e.g. when a modal is open)
 */
export function useLenis(enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            smoothTouch: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        const rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, [enabled]);
}
