import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapReveal — animates an element from below into view on scroll.
 * @param {object} options
 * @param {number} options.delay - stagger delay in seconds (default 0)
 * @param {number} options.y - starting y offset (default 40)
 * @param {number} options.duration - animation duration (default 0.7)
 */
export function useGsapReveal({ delay = 0, y = 40, duration = 0.7 } = {}) {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;

        gsap.fromTo(
            el,
            { opacity: 0, y },
            {
                opacity: 1,
                y: 0,
                duration,
                delay,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );

        return () => {
            ScrollTrigger.getAll().forEach((t) => {
                if (t.trigger === el) t.kill();
            });
        };
    }, [delay, y, duration]);

    return ref;
}

/**
 * useGsapCountUp — animates a number from 0 to target on scroll enter.
 * @param {number} target - final number value
 * @param {string} suffix - suffix string e.g. '%' or 'd'
 */
export function useGsapCountUp(target, suffix = '') {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || target == null) return;
        const el = ref.current;
        const obj = { val: 0 };

        const trigger = ScrollTrigger.create({
            trigger: el,
            start: 'top 90%',
            once: true,
            onEnter: () => {
                gsap.to(obj, {
                    val: target,
                    duration: 1.4,
                    ease: 'power2.out',
                    onUpdate: () => {
                        el.textContent = Math.round(obj.val) + suffix;
                    },
                });
            },
        });

        return () => trigger.kill();
    }, [target, suffix]);

    return ref;
}
