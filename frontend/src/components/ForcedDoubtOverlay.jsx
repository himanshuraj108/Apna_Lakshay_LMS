import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DoubtBoard from '../pages/student/DoubtBoard';

const STORAGE_KEY = 'doubt_btn_y_ratio';
const BTN_HEIGHT  = 124;
const BTN_WIDTH   = 52;

function getSavedY() {
    try {
        const r = parseFloat(localStorage.getItem(STORAGE_KEY));
        if (!isNaN(r) && r >= 0 && r <= 1) return r;
    } catch {}
    return 0.42;
}

const ForcedDoubtOverlay = ({ onClose }) => {
    const [isOpen, setIsOpen]     = useState(false);
    const [yRatio, setYRatio]     = useState(getSavedY);
    const [dragging, setDragging] = useState(false);

    const isDragging  = useRef(false);
    const startY      = useRef(0);
    const startTop    = useRef(0);
    const moved       = useRef(false);

    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const maxTop  = screenH - BTN_HEIGHT - 20;
    const minTop  = 20;
    const btnTop  = Math.max(minTop, Math.min(maxTop, yRatio * screenH));

    const saveAndMaybeOpen = useCallback(() => {
        try { localStorage.setItem(STORAGE_KEY, yRatio.toString()); } catch {}
        if (!moved.current) setIsOpen(true);
        moved.current = false;
    }, [yRatio]);

    // ── Touch ──────────────────────────────────────────────────────────────────
    const onTouchStart = useCallback((e) => {
        isDragging.current = true; moved.current = false;
        startY.current = e.touches[0].clientY; startTop.current = btnTop;
        setDragging(true);
    }, [btnTop]);

    const onTouchMove = useCallback((e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const dy = e.touches[0].clientY - startY.current;
        if (Math.abs(dy) > 5) moved.current = true;
        setYRatio(Math.max(minTop, Math.min(maxTop, startTop.current + dy)) / screenH);
    }, [minTop, maxTop, screenH]);

    const onTouchEnd = useCallback(() => {
        isDragging.current = false; setDragging(false);
        saveAndMaybeOpen();
    }, [saveAndMaybeOpen]);

    // ── Mouse ──────────────────────────────────────────────────────────────────
    const onMouseDown = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true; moved.current = false;
        startY.current = e.clientY; startTop.current = btnTop;
        setDragging(true);
        const move = (e2) => {
            const dy = e2.clientY - startY.current;
            if (Math.abs(dy) > 5) moved.current = true;
            setYRatio(Math.max(minTop, Math.min(maxTop, startTop.current + dy)) / screenH);
        };
        const up = () => {
            isDragging.current = false; setDragging(false);
            saveAndMaybeOpen();
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
    }, [btnTop, minTop, maxTop, screenH, saveAndMaybeOpen]);

    return (
        <>
            {/* 2 clean animations: soft glow pulse + arrow bounce */}
            <style>{`
                @keyframes softGlow {
                    0%,100% { box-shadow: 3px 0 12px rgba(249,115,22,0.45), 0 0 0 0 rgba(249,115,22,0.35); }
                    50%     { box-shadow: 3px 0 28px rgba(249,115,22,0.85), 0 0 0 12px rgba(249,115,22,0.0); }
                }
                @keyframes arrowBounce {
                    0%,100% { transform: translateX(0); }
                    50%     { transform: translateX(5px); }
                }
            `}</style>

            {/* ── Trigger tab ── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        key="trigger"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                        style={{
                            position: 'fixed', top: btnTop, left: 0,
                            zIndex: 99990, userSelect: 'none', touchAction: 'none',
                            cursor: dragging ? 'grabbing' : 'grab',
                        }}
                        onMouseDown={onMouseDown}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <motion.div
                            animate={{ width: dragging ? BTN_WIDTH + 10 : BTN_WIDTH, scale: dragging ? 1.04 : 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                height: BTN_HEIGHT,
                                background: 'linear-gradient(170deg,#c2410c 0%,#ea580c 35%,#f97316 65%,#fb923c 100%)',
                                borderRadius: '0 22px 22px 0',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 7, overflow: 'hidden', position: 'relative',
                                animation: 'softGlow 2s ease-in-out infinite',
                            }}
                        >
                            {/* Left dark edge */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'rgba(0,0,0,0.22)' }} />

                            {/* Drag handle dots */}
                            <div style={{ position: 'absolute', top: 6, right: 5, display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.45 }}>
                                {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />)}
                            </div>

                            {/* ? circle */}
                            <div style={{
                                width: 33, height: 33, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                                background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            }}>
                                <span style={{ fontSize: 19, fontWeight: 900, color: '#fff', fontFamily: 'Georgia,serif', lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>?</span>
                            </div>

                            {/* DOUBT label */}
                            <span style={{
                                writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
                                fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
                                color: '#fff', zIndex: 1, textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            }}>Doubt</span>

                            {/* Bouncing arrow */}
                            <div style={{ animation: 'arrowBounce 1.3s ease-in-out infinite', zIndex: 1 }}>
                                <svg width="11" height="17" viewBox="0 0 11 17" fill="none">
                                    <path d="M2 2l7 6.5-7 6.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Full-screen DoubtBoard ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="board"
                        initial={{ x: '-100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0.5 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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