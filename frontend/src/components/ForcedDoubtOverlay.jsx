import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DoubtBoard from '../pages/student/DoubtBoard';

const STORAGE_KEY = 'doubt_btn_y_ratio'; // store as ratio 0-1 of screen height
const BTN_HEIGHT  = 130;
const BTN_WIDTH   = 52;

function getSavedY() {
    try {
        const r = parseFloat(localStorage.getItem(STORAGE_KEY));
        if (!isNaN(r) && r >= 0 && r <= 1) return r;
    } catch {}
    return 0.4; // default: ~40% from top
}

const ForcedDoubtOverlay = ({ onClose }) => {
    const [isOpen, setIsOpen]   = useState(false);
    const [yRatio, setYRatio]   = useState(getSavedY);
    const [dragging, setDragging] = useState(false);
    const [hovered, setHovered]  = useState(false);

    const isDragging  = useRef(false);
    const dragStartY  = useRef(0);
    const dragStartRatio = useRef(0);
    const moved       = useRef(false); // distinguish tap vs drag
    const canvasRef   = useRef(null);
    const animRef     = useRef(null);

    // Computed top from ratio
    const maxTop    = window.innerHeight - BTN_HEIGHT - 20;
    const minTop    = 20;
    const buttonTop = Math.max(minTop, Math.min(maxTop, yRatio * window.innerHeight));

    // ── Particle canvas ────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width  = BTN_WIDTH;
        canvas.height = BTN_HEIGHT;

        const particles = Array.from({ length: 20 }, () => ({
            x: Math.random() * BTN_WIDTH,
            y: Math.random() * BTN_HEIGHT,
            r: Math.random() * 1.8 + 0.4,
            vy: -(Math.random() * 0.5 + 0.15),
            vx: (Math.random() - 0.5) * 0.25,
            alpha: Math.random() * 0.6 + 0.2,
            color: Math.random() > 0.55 ? '99,102,241' : '249,115,22',
        }));

        const draw = () => {
            ctx.clearRect(0, 0, BTN_WIDTH, BTN_HEIGHT);
            particles.forEach(p => {
                p.y     += p.vy;
                p.x     += p.vx;
                p.alpha -= 0.005;
                if (p.alpha <= 0 || p.y < 0) {
                    p.y     = BTN_HEIGHT;
                    p.x     = Math.random() * BTN_WIDTH;
                    p.alpha = Math.random() * 0.6 + 0.25;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.alpha.toFixed(2)})`;
                ctx.fill();
            });
            animRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [isOpen]);

    // ── Touch drag handlers ────────────────────────────────────────────────────
    const handleTouchStart = useCallback((e) => {
        isDragging.current  = true;
        moved.current       = false;
        dragStartY.current  = e.touches[0].clientY;
        dragStartRatio.current = yRatio;
        setDragging(true);
    }, [yRatio]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const dy   = e.touches[0].clientY - dragStartY.current;
        if (Math.abs(dy) > 6) moved.current = true;
        const newTop   = buttonTop + dy;
        const clamped  = Math.max(minTop, Math.min(maxTop, newTop));
        setYRatio(clamped / window.innerHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buttonTop, minTop, maxTop]);

    const handleTouchEnd = useCallback(() => {
        isDragging.current = false;
        setDragging(false);
        // Save position
        try { localStorage.setItem(STORAGE_KEY, yRatio.toString()); } catch {}
        // If barely moved → treat as tap → open
        if (!moved.current) setIsOpen(true);
        moved.current = false;
    }, [yRatio]);

    // ── Mouse drag handlers (desktop) ─────────────────────────────────────────
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true;
        moved.current      = false;
        dragStartY.current = e.clientY;
        dragStartRatio.current = yRatio;
        setDragging(true);

        const onMove = (e2) => {
            if (!isDragging.current) return;
            const dy = e2.clientY - dragStartY.current;
            if (Math.abs(dy) > 6) moved.current = true;
            const newTop  = buttonTop + dy;
            const clamped = Math.max(minTop, Math.min(maxTop, newTop));
            setYRatio(clamped / window.innerHeight);
        };
        const onUp = () => {
            isDragging.current = false;
            setDragging(false);
            try { localStorage.setItem(STORAGE_KEY, yRatio.toString()); } catch {}
            if (!moved.current) setIsOpen(true);
            moved.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup',  onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yRatio, buttonTop, minTop, maxTop]);

    return (
        <>
            <style>{`
                @keyframes triggerRing {
                    0%   { box-shadow: 3px 0 0 0 rgba(99,102,241,0.7); }
                    70%  { box-shadow: 3px 0 0 16px rgba(99,102,241,0); }
                    100% { box-shadow: 3px 0 0 0 rgba(99,102,241,0); }
                }
                @keyframes qPop {
                    0%,85%,100% { transform: scale(1); }
                    90%         { transform: scale(1.2) rotate(-10deg); }
                    95%         { transform: scale(1.2) rotate(10deg); }
                }
                @keyframes arrowPing {
                    0%,100% { transform: translateX(0); opacity:.7; }
                    50%     { transform: translateX(5px); opacity:1; }
                }
                @keyframes shimmerSweep {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes scanline {
                    0%   { top: -3px; opacity:.5; }
                    85%  { opacity:.5; }
                    100% { top: ${BTN_HEIGHT + 3}px; opacity:0; }
                }
            `}</style>

            {/* ── Draggable trigger button ── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        key="trigger"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        style={{
                            position: 'fixed',
                            left: 0,
                            top: buttonTop,
                            zIndex: 99990,
                            cursor: dragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            touchAction: 'none',
                        }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Particle canvas */}
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                pointerEvents: 'none',
                                borderRadius: `0 20px 20px 0`,
                            }}
                        />

                        {/* Button body */}
                        <motion.div
                            onHoverStart={() => setHovered(true)}
                            onHoverEnd={() => setHovered(false)}
                            animate={{ width: hovered || dragging ? 64 : BTN_WIDTH, scale: dragging ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                position: 'relative',
                                height: BTN_HEIGHT,
                                background: 'linear-gradient(170deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                                borderRadius: '0 20px 20px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                overflow: 'hidden',
                                animation: 'triggerRing 2.2s ease-out infinite',
                                boxShadow: dragging
                                    ? '4px 0 28px rgba(99,102,241,0.6)'
                                    : '3px 0 18px rgba(30,20,80,0.45)',
                            }}
                        >
                            {/* Shimmer */}
                            <div style={{
                                position: 'absolute', inset: 0, pointerEvents: 'none',
                                background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.07) 50%,transparent 65%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmerSweep 2.8s linear infinite',
                                borderRadius: '0 20px 20px 0',
                            }} />

                            {/* Scanline */}
                            <div style={{
                                position: 'absolute', left: 0, right: 0, height: 2,
                                background: 'linear-gradient(to right,transparent,rgba(99,102,241,0.5),transparent)',
                                animation: 'scanline 2.6s linear infinite',
                                pointerEvents: 'none',
                            }} />

                            {/* Left accent stripe */}
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                                background: 'linear-gradient(180deg,#6366f1,#f97316,#6366f1)',
                            }} />

                            {/* Drag handle dots */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: 3,
                                position: 'absolute', top: 8, right: 6, opacity: 0.4,
                            }}>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#a5b4fc' }} />
                                ))}
                            </div>

                            {/* ? badge */}
                            <div style={{
                                width: 34, height: 34, borderRadius: 10, flexShrink: 0, zIndex: 1,
                                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 3px 12px rgba(249,115,22,0.6)',
                                animation: 'qPop 4s ease-in-out infinite',
                            }}>
                                <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Georgia,serif', lineHeight: 1 }}>?</span>
                            </div>

                            {/* Label */}
                            <span style={{
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                transform: 'rotate(180deg)',
                                fontSize: 9, fontWeight: 800,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: '#a5b4fc',
                                zIndex: 1,
                            }}>Doubt</span>

                            {/* Arrow */}
                            <div style={{ animation: 'arrowPing 1.4s ease-in-out infinite', zIndex: 1 }}>
                                <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                                    <path d="M2 2l6 6-6 6" stroke="#f97316" strokeWidth="2.5"
                                        strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </motion.div>

                        {/* Tooltip on hover */}
                        <AnimatePresence>
                            {hovered && !dragging && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.18 }}
                                    style={{
                                        position: 'absolute',
                                        left: '110%',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: '#1e1b4b',
                                        color: '#e0e7ff',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: '5px 10px',
                                        borderRadius: 8,
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                                        pointerEvents: 'none',
                                        zIndex: 2,
                                    }}
                                >
                                    🤔 AI Doubt Board
                                    <div style={{
                                        position: 'absolute', right: '100%', top: '50%',
                                        transform: 'translateY(-50%)',
                                        border: '5px solid transparent',
                                        borderRightColor: '#1e1b4b',
                                    }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Full-screen DoubtBoard ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="board"
                        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }}
                        animate={{ clipPath: 'inset(0 0% 0 0)',   opacity: 1   }}
                        exit={{ clipPath: 'inset(0 100% 0 0)',    opacity: 0.6 }}
                        transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ position: 'fixed', inset: 0, zIndex: 99991, background: '#ffffff' }}
                    >
                        <DoubtBoard forceMode={true} onClose={() => setIsOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ForcedDoubtOverlay;