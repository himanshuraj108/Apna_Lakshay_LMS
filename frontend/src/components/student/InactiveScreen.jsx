import { motion } from 'framer-motion';
import {
    IoLibraryOutline, IoLogOutOutline,
    IoCallOutline, IoCheckmarkCircle,
    IoTrophyOutline, IoFlashOutline, IoRocketOutline,
    IoHeartOutline, IoStar, IoTimeOutline, IoLockClosedOutline
} from 'react-icons/io5';

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const STYLE = `
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
@keyframes shimmer-title {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
}
@keyframes spin-slow { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
@keyframes pulse-soft { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
@keyframes badge-bounce {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-3px); }
}
.inactive-title-shimmer {
    background: linear-gradient(90deg, #f59e0b, #ef4444, #ec4899, #a855f7, #f59e0b);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer-title 5s linear infinite;
}
.cta-glow {
    box-shadow: 0 4px 32px rgba(245,158,11,0.3), 0 0 64px rgba(245,158,11,0.12),
                inset 0 1px 0 rgba(255,255,255,0.18);
}
`;

/* ─── Feature row ─────────────────────────────────────────────────────── */
const Feature = ({ icon: Icon, text, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.38 }}
        className="flex items-center gap-3 py-2.5 px-4 rounded-xl"
        style={{ background: `${color}0d`, border: `1px solid ${color}20` }}
    >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}18` }}>
            <Icon size={14} style={{ color }} />
        </div>
        <span className="text-sm font-medium text-gray-300">{text}</span>
        <IoCheckmarkCircle size={14} className="ml-auto shrink-0" style={{ color }} />
    </motion.div>
);

/* ════════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════════ */
const InactiveScreen = ({ user, onLogout }) => {
    const firstName = user?.name?.split(' ')[0] || 'Student';

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4"
            style={{ background: '#070a10' }}>
            <style>{STYLE}</style>

            {/* ── Ambient background ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[-8%] w-[600px] h-[600px] rounded-full blur-[130px]"
                    style={{ background: 'rgba(245,158,11,0.07)', animation: 'orb-drift1 22s ease-in-out infinite' }} />
                <div className="absolute bottom-[-15%] right-[-8%] w-[550px] h-[550px] rounded-full blur-[120px]"
                    style={{ background: 'rgba(168,85,247,0.07)', animation: 'orb-drift2 28s ease-in-out infinite' }} />
                <div className="absolute top-[40%] right-[20%] w-[280px] h-[280px] rounded-full blur-[100px]"
                    style={{ background: 'rgba(236,72,153,0.05)', animation: 'orb-drift1 18s ease-in-out infinite reverse' }} />
                {/* grid */}
                <div className="absolute inset-0"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.022) 1px, transparent 0)', backgroundSize: '52px 52px' }} />
            </div>

            {/* ── Card ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Glowing border */}
                <div className="absolute -inset-[1px] rounded-3xl opacity-60"
                    style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.7), rgba(236,72,153,0.4), rgba(168,85,247,0.4))',
                        filter: 'blur(1px)',
                    }} />

                <div className="relative rounded-3xl overflow-hidden"
                    style={{ background: 'linear-gradient(170deg, #0e1117, #131925, #0e1117)' }}>

                    {/* Top accent bar */}
                    <div className="h-[3px] w-full"
                        style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444,#ec4899,#a855f7)' }} />

                    {/* ── Hero ── */}
                    <div className="relative px-8 pt-10 pb-8 text-center"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

                        {/* Icon with ring */}
                        <div className="relative w-24 h-24 mx-auto mb-7">
                            <div className="absolute inset-0 rounded-full"
                                style={{ border: '1.5px dashed rgba(245,158,11,0.25)', animation: 'spin-slow 10s linear infinite' }} />
                            <div className="absolute inset-0 rounded-full"
                                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent)', animation: 'pulse-soft 3s ease-in-out infinite' }} />
                            <div className="absolute inset-4 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    boxShadow: '0 0 24px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.08)'
                                }}>
                                <IoLockClosedOutline size={30} className="text-amber-400" />
                            </div>
                        </div>

                        {/* Status pill */}
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 18 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.28)',
                            }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"
                                style={{ animation: 'pulse-soft 1.8s ease-in-out infinite' }} />
                            <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Account Inactive</span>
                        </motion.div>

                        {/* Name */}
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-black text-white mb-3"
                        >
                            Hi, {firstName}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.28 }}
                            className="text-base font-bold mb-4 inactive-title-shimmer"
                        >
                            Your membership is currently paused.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.36 }}
                            className="text-gray-400 text-sm leading-relaxed"
                        >
                            Your account has been deactivated by the admin. To continue
                            using your seat, attendance tracking, and study tools — please
                            contact the library admin to re-activate your membership.
                        </motion.p>
                    </div>

                    {/* ── What you'll get back ── */}
                    <div className="px-8 py-6"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.44 }}
                            className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-3"
                        >
                            What you get on re-activation
                        </motion.p>
                        <div className="flex flex-col gap-2">
                            {[
                                { icon: IoTrophyOutline, text: 'Access to your assigned seat & shift',         color: '#f59e0b', delay: 0.46 },
                                { icon: IoFlashOutline,  text: 'AI doubt solving & mock test generator',        color: '#a855f7', delay: 0.52 },
                                { icon: IoRocketOutline, text: 'Monthly attendance reports & streaks',          color: '#3b82f6', delay: 0.58 },
                                { icon: IoHeartOutline,  text: 'Student rankings & peer leaderboard',           color: '#ec4899', delay: 0.64 },
                                { icon: IoStar,          text: 'All your previous data is preserved safely',    color: '#10b981', delay: 0.70 },
                            ].map((f, i) => (
                                <Feature key={i} {...f} />
                            ))}
                        </div>
                    </div>

                    {/* ── CTA ── */}
                    <div className="px-8 py-8">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.76 }}
                            className="text-center text-sm text-gray-400 mb-5 leading-relaxed"
                        >
                            Contact the admin to get your account re-activated.
                            <br />
                            <span className="text-amber-400 font-semibold">Your data and history are safe.</span>
                        </motion.p>

                        {/* Primary CTA — opens contact page */}
                        <motion.a
                            href="https://www.apnalakshay.com/contact"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.82, type: 'spring', stiffness: 240, damping: 20 }}
                            whileHover={{ scale: 1.025, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="cta-glow w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[15px] font-black text-white mb-3 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #d97706, #ef4444)',
                                textDecoration: 'none',
                                display: 'flex',
                            }}
                        >
                            {/* shine sweep on hover */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-700 transition-transform"
                                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)' }} />
                            <IoCallOutline size={18} />
                            Contact Admin to Re-Activate
                        </motion.a>

                        {/* Logout */}
                        <motion.button
                            onClick={onLogout}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.90 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:text-gray-300 transition-colors"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            <IoLogOutOutline size={15} />
                            Sign Out
                        </motion.button>

                        {/* Footer */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                            className="text-center text-[11px] text-gray-600 mt-5 flex items-center justify-center gap-1.5"
                        >
                            <IoTimeOutline size={12} />
                            Your attendance history and data are fully preserved
                        </motion.p>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default InactiveScreen;
