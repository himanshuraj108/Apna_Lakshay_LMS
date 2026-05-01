import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    IoSparklesOutline, IoLibraryOutline, IoLogOutOutline,
    IoCallOutline, IoCheckmarkCircle, IoStar, IoRocketOutline,
    IoTrophyOutline, IoFlashOutline, IoHeartOutline, IoTimeOutline
} from 'react-icons/io5';

/* ─── Inject CSS once ─────────────────────────────────────────────────── */
const INACTIVE_STYLE = `
@keyframes glow-pulse {
    0%,100% { opacity:0.6; transform:scale(1); }
    50%      { opacity:1;   transform:scale(1.08); }
}
@keyframes float-up {
    0%   { transform:translateY(0px)   rotate(0deg);  opacity:1; }
    100% { transform:translateY(-80px) rotate(20deg); opacity:0; }
}
@keyframes badge-in {
    0%   { transform:scale(0) rotate(-12deg); opacity:0; }
    70%  { transform:scale(1.1) rotate(2deg); }
    100% { transform:scale(1) rotate(0deg);   opacity:1; }
}
@keyframes shimmer-slow {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
}
@keyframes orb-drift1 {
    0%,100% { transform:translate(0,0) scale(1); }
    33%     { transform:translate(60px,-80px) scale(1.1); }
    66%     { transform:translate(-40px,30px) scale(0.9); }
}
@keyframes orb-drift2 {
    0%,100% { transform:translate(0,0) scale(1); }
    33%     { transform:translate(-60px,40px) scale(1.08); }
    66%     { transform:translate(30px,-50px) scale(0.92); }
}
@keyframes spin-slow {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
}
@keyframes bounce-y {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-8px); }
}
.inactive-shimmer {
    background: linear-gradient(90deg,#f59e0b,#ef4444,#ec4899,#a855f7,#f59e0b);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer-slow 4s linear infinite;
}
.inactive-cta-glow {
    box-shadow: 0 0 40px rgba(245,158,11,0.35), 0 0 80px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.2);
}
`;

/* ─── Floating emoji particles ─────────────────────────────────────────── */
const PARTICLES = ['📚', '🎯', '✨', '🏆', '💡', '🚀', '⭐', '🔥', '📖', '💪'];

const FloatingParticle = ({ emoji, style }) => (
    <span
        className="absolute text-2xl pointer-events-none select-none"
        style={{
            animation: `float-up ${2.5 + Math.random() * 2}s ease-out forwards`,
            ...style
        }}
    >{emoji}</span>
);

/* ─── Feature item ──────────────────────────────────────────────────────── */
const Feature = ({ icon: Icon, text, color }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 py-2.5 px-4 rounded-xl"
        style={{ background: `${color}10`, border: `1px solid ${color}22` }}
    >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}20` }}>
            <Icon size={14} style={{ color }} />
        </div>
        <span className="text-sm font-medium text-gray-200">{text}</span>
        <IoCheckmarkCircle size={15} className="ml-auto shrink-0" style={{ color }} />
    </motion.div>
);

/* ─── Stat badge ────────────────────────────────────────────────────────── */
const StatBadge = ({ value, label, color, delay }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 280, damping: 20 }}
        className="flex flex-col items-center justify-center rounded-2xl p-4"
        style={{
            background: `linear-gradient(145deg, ${color}15, ${color}06)`,
            border: `1px solid ${color}30`,
            minWidth: 80
        }}
    >
        <span className="text-2xl font-black" style={{ color }}>{value}</span>
        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{label}</span>
    </motion.div>
);

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
const InactiveScreen = ({ user, onLogout }) => {
    const particlesRef = useRef([]);

    // Spawn particles on mount for dopamine burst
    useEffect(() => {
        const container = document.getElementById('inactive-particle-zone');
        if (!container) return;

        let count = 0;
        const interval = setInterval(() => {
            if (count >= 12) { clearInterval(interval); return; }
            const el = document.createElement('span');
            el.textContent = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
            el.style.cssText = `
                position:absolute; font-size:${20 + Math.random() * 16}px;
                left:${10 + Math.random() * 80}%;
                bottom:0; pointer-events:none; user-select:none;
                animation:float-up ${2.5 + Math.random() * 2}s ease-out forwards;
                z-index:5;
            `;
            container.appendChild(el);
            setTimeout(() => el.remove(), 4500);
            count++;
        }, 180);
        return () => clearInterval(interval);
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Student';

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4"
            style={{ background: '#070a10' }}>
            <style>{INACTIVE_STYLE}</style>

            {/* Animated orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[140px]"
                    style={{ background: 'rgba(245,158,11,0.07)', animation: 'orb-drift1 20s ease-in-out infinite' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]"
                    style={{ background: 'rgba(168,85,247,0.07)', animation: 'orb-drift2 25s ease-in-out infinite' }} />
                <div className="absolute top-[30%] right-[15%] w-[300px] h-[300px] rounded-full blur-[100px]"
                    style={{ background: 'rgba(236,72,153,0.05)', animation: 'orb-drift2 18s ease-in-out infinite' }} />
                {/* Grid */}
                <div className="absolute inset-0"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)', backgroundSize: '52px 52px' }} />
            </div>

            {/* Particle zone */}
            <div id="inactive-particle-zone" className="fixed inset-0 pointer-events-none overflow-hidden z-[1]" />

            {/* ── Card ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className="relative z-10 w-full max-w-lg"
            >
                {/* Glowing border ring */}
                <div className="absolute -inset-[1px] rounded-3xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.6), rgba(236,72,153,0.4), rgba(168,85,247,0.4), rgba(245,158,11,0.6))',
                        backgroundSize: '300% 300%',
                        animation: 'shimmer-slow 4s linear infinite',
                        filter: 'blur(1px)',
                    }} />

                <div className="relative rounded-3xl overflow-hidden"
                    style={{ background: 'linear-gradient(170deg, #0d1117, #111827, #0d1117)' }}>

                    {/* ── Top gradient bar ── */}
                    <div className="h-1 w-full"
                        style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444,#ec4899,#a855f7)' }} />

                    {/* ── Hero section ── */}
                    <div className="relative px-8 pt-10 pb-8 text-center"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

                        {/* Spinning ring behind icon */}
                        <div className="relative w-28 h-28 mx-auto mb-6">
                            {/* Outer spin ring */}
                            <div className="absolute inset-0 rounded-full"
                                style={{
                                    border: '2px dashed rgba(245,158,11,0.3)',
                                    animation: 'spin-slow 8s linear infinite'
                                }} />
                            {/* Inner glow */}
                            <div className="absolute inset-2 rounded-full"
                                style={{
                                    background: 'radial-gradient(circle, rgba(245,158,11,0.2), transparent)',
                                    animation: 'glow-pulse 2.5s ease-in-out infinite'
                                }} />
                            {/* Icon circle */}
                            <div className="absolute inset-4 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))',
                                    border: '1px solid rgba(245,158,11,0.35)',
                                    boxShadow: '0 0 30px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                                }}>
                                <IoLibraryOutline size={36} className="text-amber-400" />
                            </div>
                            {/* Corner sparkle */}
                            <motion.div
                                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                className="absolute top-1 right-1"
                            >
                                <IoSparklesOutline size={18} className="text-amber-400" />
                            </motion.div>
                        </div>

                        {/* Status badge */}
                        <motion.div
                            initial={{ scale: 0, rotate: -12 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 18 }}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171'
                            }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            Membership Paused
                        </motion.div>

                        {/* Greeting */}
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-black mb-2"
                        >
                            Hey {firstName}! <span style={{ animation: 'bounce-y 2s ease-in-out infinite', display: 'inline-block' }}>👋</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.28 }}
                            className="text-lg font-bold mb-3 inactive-shimmer"
                        >
                            Your journey isn't over — it's just paused.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.36 }}
                            className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto"
                        >
                            Your account is currently <strong className="text-white">inactive</strong>. But the good news?
                            One conversation with admin is all it takes to get back on track. Your seat, your focus, your future — they're all waiting. 🎯
                        </motion.p>
                    </div>

                    {/* ── Stats row ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-center gap-3 px-8 py-6"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <StatBadge value="100+" label="Seats" color="#a855f7" delay={0.42} />
                        <StatBadge value="AC" label="Rooms" color="#3b82f6" delay={0.50} />
                        <StatBadge value="24/7" label="Access" color="#10b981" delay={0.58} />
                        <StatBadge value="AI" label="Doubts" color="#f59e0b" delay={0.66} />
                    </motion.div>

                    {/* ── What awaits you section ── */}
                    <div className="px-8 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3"
                        >✨ What's waiting for you</motion.p>
                        <div className="flex flex-col gap-2">
                            {[
                                { icon: IoTrophyOutline,  text: 'Personal study seat with your preferred shift',    color: '#f59e0b', delay: 0.52 },
                                { icon: IoFlashOutline,   text: 'AI doubt solving & mock test generator',            color: '#a855f7', delay: 0.58 },
                                { icon: IoRocketOutline,  text: 'Real-time attendance tracking & monthly reports',   color: '#3b82f6', delay: 0.64 },
                                { icon: IoHeartOutline,   text: 'Study streaks, rankings & peer motivation',        color: '#ec4899', delay: 0.70 },
                                { icon: IoStar,           text: 'Peaceful, distraction-free premium environment',    color: '#10b981', delay: 0.76 },
                            ].map(({ icon, text, color, delay }, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay }}
                                >
                                    <Feature icon={icon} text={text} color={color} />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* ── CTA section ── */}
                    <div className="px-8 py-8">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-center text-sm text-gray-400 mb-5 leading-relaxed"
                        >
                            To re-activate your membership, simply contact your library admin.<br />
                            <span className="text-amber-400 font-semibold">It takes less than 2 minutes.</span>
                        </motion.p>

                        {/* Primary CTA */}
                        <motion.a
                            href="tel:+91"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.88, type: 'spring', stiffness: 250 }}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="inactive-cta-glow w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-black text-white mb-3 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)',
                                cursor: 'pointer',
                                textDecoration: 'none'
                            }}
                        >
                            {/* Shimmer sweep */}
                            <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700"
                                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)' }} />
                            <IoCallOutline size={20} />
                            Contact Admin to Re-Activate
                            <IoSparklesOutline size={16} className="opacity-80" />
                        </motion.a>

                        {/* Secondary: logout */}
                        <motion.button
                            onClick={onLogout}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.96 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:text-gray-300 transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <IoLogOutOutline size={16} />
                            Sign Out
                        </motion.button>

                        {/* Footer note */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1 }}
                            className="text-center text-[11px] text-gray-600 mt-5 flex items-center justify-center gap-1.5"
                        >
                            <IoTimeOutline size={12} />
                            Your previous data &amp; progress is safely preserved
                        </motion.p>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default InactiveScreen;
