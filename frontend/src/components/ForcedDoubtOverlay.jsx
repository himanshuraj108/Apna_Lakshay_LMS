import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DoubtBoard from '../pages/student/DoubtBoard';

const STORAGE_KEY      = 'doubt_btn_y_ratio';
const DISMISSED_KEY    = 'doubt_tutorial_dismissed'; // localStorage → permanent dismiss
const SESSION_SHOWN_KEY = 'doubt_tutorial_shown';    // sessionStorage → shown this login session
const BTN_HEIGHT = 124;
const BTN_WIDTH  = 52;

function getSavedY() {
    try {
        const r = parseFloat(localStorage.getItem(STORAGE_KEY));
        if (!isNaN(r) && r >= 0 && r <= 1) return r;
    } catch {}
    return 0.42;
}

function shouldShowTutorial() {
    try {
        if (localStorage.getItem(DISMISSED_KEY) === 'true') return false; // permanently dismissed
        if (sessionStorage.getItem(SESSION_SHOWN_KEY) === 'true') return false; // already shown this session
        return true;
    } catch { return false; }
}

// ── Spotlight Tutorial Overlay ─────────────────────────────────────────────────
const TutorialOverlay = ({ btnTop, onDismiss, onDismissPermanent }) => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth  : 400;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Callout box position: to the right of the button, vertically centered near it
    const calloutLeft = BTN_WIDTH + 24;
    const calloutTop  = Math.min(
        Math.max(btnTop - 30, 16),
        screenH - 220
    );

    return (
        <motion.div
            key="tutorial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
                position: 'fixed', inset: 0,
                zIndex: 99995,
                backdropFilter: 'blur(7px)',
                WebkitBackdropFilter: 'blur(7px)',
                background: 'rgba(0,0,0,0.72)',
            }}
            onClick={onDismiss}
        >
            {/* Stop propagation on the callout so clicking it doesn't dismiss */}
            <div onClick={e => e.stopPropagation()}>

                {/* ── Highlight ring around the button ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                    style={{
                        position: 'absolute',
                        top: btnTop - 8,
                        left: -8,
                        width: BTN_WIDTH + 16,
                        height: BTN_HEIGHT + 16,
                        borderRadius: '0 28px 28px 0',
                        border: '2.5px solid rgba(249,115,22,0.9)',
                        boxShadow: '0 0 0 6px rgba(249,115,22,0.18), 0 0 40px rgba(249,115,22,0.45)',
                        pointerEvents: 'none',
                    }}
                />

                {/* ── Animated arrow pointing LEFT toward the button ── */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: [20, 0, 8, 0], opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6, times: [0, 0.5, 0.75, 1] }}
                    style={{
                        position: 'absolute',
                        top: btnTop + (BTN_HEIGHT / 2) - 14,
                        left: calloutLeft,
                    }}
                >
                    {/* Bouncing arrow animation */}
                    <motion.div
                        animate={{ x: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        {/* Three arrow chevrons for emphasis */}
                        {[0, 1, 2].map(i => (
                            <motion.svg
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18, ease: 'easeInOut' }}
                                width="18" height="28" viewBox="0 0 18 28" fill="none"
                            >
                                <path d="M14 2L4 14l10 12" stroke="#f97316" strokeWidth="3.5"
                                    strokeLinecap="round" strokeLinejoin="round"/>
                            </motion.svg>
                        ))}
                    </motion.div>
                </motion.div>

                {/* ── Callout box ── */}
                <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.45, type: 'spring', stiffness: 260, damping: 22 }}
                    style={{
                        position: 'absolute',
                        top: calloutTop,
                        left: calloutLeft + 70,
                        width: Math.min(screenW - calloutLeft - 90, 260),
                        background: '#ffffff',
                        borderRadius: 20,
                        padding: '20px 18px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(249,115,22,0.2)',
                    }}
                >
                    {/* Orange top accent */}
                    <div style={{
                        position: 'absolute', top: 0, left: 20, right: 20, height: 3,
                        background: 'linear-gradient(to right, #f97316, #ea580c)',
                        borderRadius: '0 0 4px 4px',
                    }} />

                    {/* Icon + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                            background: 'linear-gradient(135deg,#f97316,#ea580c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
                        }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Georgia,serif' }}>?</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                                AI Doubt Board
                            </p>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#334155', margin: '1px 0 0', lineHeight: 1.3 }}>
                                AI डाउट बोर्ड
                            </p>
                            <p style={{ fontSize: 9, color: '#f97316', fontWeight: 700, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available now • अभी उपलब्ध</p>
                        </div>
                    </div>

                    <p style={{ fontSize: 12.5, color: '#334155', margin: '0 0 4px', lineHeight: 1.6 }}>
                        Tap the <span style={{ color: '#ea580c', fontWeight: 700 }}>orange button</span> on the left to ask any doubt instantly with AI.
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px', lineHeight: 1.6 }}>
                        बाईं तरफ <span style={{ color: '#ea580c', fontWeight: 700 }}>ऑरेंज बटन</span> दबाएं और AI से कोई भी सवाल पूछें।
                    </p>

                    {/* Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                            onClick={onDismissPermanent}
                            style={{
                                width: '100%', padding: '10px', borderRadius: 12,
                                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                                color: '#fff', fontWeight: 800, fontSize: 13,
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
                                lineHeight: 1.5,
                            }}
                        >
                            Got it &nbsp;|&nbsp; समझ गया
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

// ── Main Overlay ───────────────────────────────────────────────────────────────
const ForcedDoubtOverlay = ({ onClose }) => {
    const [isOpen, setIsOpen]         = useState(false);
    const [yRatio, setYRatio]         = useState(getSavedY);
    const [dragging, setDragging]     = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    const isDragging = useRef(false);
    const startY     = useRef(0);
    const startTop   = useRef(0);
    const moved      = useRef(false);

    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const maxTop  = screenH - BTN_HEIGHT - 20;
    const minTop  = 20;
    const btnTop  = Math.max(minTop, Math.min(maxTop, yRatio * screenH));

    // Show tutorial on first render of this session (if not permanently dismissed)
    useEffect(() => {
        if (shouldShowTutorial()) {
            // Slight delay so page renders first
            const t = setTimeout(() => {
                setShowTutorial(true);
                try { sessionStorage.setItem(SESSION_SHOWN_KEY, 'true'); } catch {}
            }, 800);
            return () => clearTimeout(t);
        }
    }, []);

    const dismissTutorial = useCallback(() => {
        setShowTutorial(false);
    }, []);

    const dismissTutorialPermanent = useCallback(() => {
        try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
        setShowTutorial(false);
    }, []);

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

            {/* ── Tutorial spotlight ── */}
            <AnimatePresence>
                {showTutorial && (
                    <TutorialOverlay
                        btnTop={btnTop}
                        onDismiss={dismissTutorial}
                        onDismissPermanent={dismissTutorialPermanent}
                    />
                )}
            </AnimatePresence>

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
                            zIndex: 99996, // above tutorial overlay so it glows through
                            userSelect: 'none', touchAction: 'none',
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
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'rgba(0,0,0,0.22)' }} />
                            <div style={{ position: 'absolute', top: 6, right: 5, display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.45 }}>
                                {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />)}
                            </div>
                            <div style={{
                                width: 33, height: 33, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                                background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            }}>
                                <span style={{ fontSize: 19, fontWeight: 900, color: '#fff', fontFamily: 'Georgia,serif', lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>?</span>
                            </div>
                            <span style={{
                                writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
                                fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
                                color: '#fff', zIndex: 1, textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            }}>Doubt</span>
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
                        style={{ position: 'fixed', inset: 0, zIndex: 99997, background: '#ffffff' }}
                    >
                        <DoubtBoard forceMode={true} onClose={() => setIsOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ForcedDoubtOverlay;