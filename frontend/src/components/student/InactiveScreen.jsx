import { motion } from 'framer-motion';
import {
    IoLibraryOutline, IoLogOutOutline, IoCallOutline,
    IoCheckmarkCircle, IoTrophyOutline, IoFlashOutline,
    IoRocketOutline, IoTimeOutline, IoLockClosedOutline
} from 'react-icons/io5';

const STYLE = `
@keyframes orb-drift1 {
    0%,100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(40px,-50px) scale(1.08);}
}
@keyframes orb-drift2 {
    0%,100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(-40px,35px) scale(0.94);}
}
@keyframes shimmer-title {
    0%{background-position:200% center;}
    100%{background-position:-200% center;}
}
@keyframes spin-slow {from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes pulse-dot {0%,100%{opacity:0.5;}50%{opacity:1;}}
.inactive-shimmer {
    background:linear-gradient(90deg,#f59e0b,#ef4444,#ec4899,#a855f7,#f59e0b);
    background-size:300% auto;
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
    animation:shimmer-title 5s linear infinite;
}
.cta-glow {
    box-shadow:0 4px 28px rgba(245,158,11,0.3),inset 0 1px 0 rgba(255,255,255,0.15);
}
`;

const Feature = ({ icon: Icon, text, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.32 }}
        className="flex items-center gap-2.5 py-2 px-3 rounded-xl"
        style={{ background: `${color}0c`, border: `1px solid ${color}1e` }}
    >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}18` }}>
            <Icon size={12} style={{ color }} />
        </div>
        <span className="text-xs font-medium text-gray-300 leading-tight">{text}</span>
        <IoCheckmarkCircle size={12} className="ml-auto shrink-0" style={{ color }} />
    </motion.div>
);

const InactiveScreen = ({ user, onLogout }) => {
    const firstName = user?.name?.split(' ')[0] || 'Student';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: '#070a10', overflow: 'hidden' }}>
            <style>{STYLE}</style>

            {/* Ambient orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full blur-[120px]"
                    style={{ background: 'rgba(245,158,11,0.07)', animation: 'orb-drift1 20s ease-in-out infinite' }} />
                <div className="absolute bottom-[-10%] right-[-8%] w-[450px] h-[450px] rounded-full blur-[110px]"
                    style={{ background: 'rgba(168,85,247,0.07)', animation: 'orb-drift2 26s ease-in-out infinite' }} />
                <div className="absolute inset-0"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.02) 1px,transparent 0)', backgroundSize: '48px 48px' }} />
            </div>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 210, damping: 22 }}
                className="relative z-10 w-full"
                style={{ maxWidth: 420 }}
            >
                {/* Glow border */}
                <div className="absolute -inset-[1px] rounded-3xl opacity-50"
                    style={{
                        background: 'linear-gradient(135deg,rgba(245,158,11,0.8),rgba(236,72,153,0.4),rgba(168,85,247,0.5))',
                        filter: 'blur(1px)'
                    }} />

                <div className="relative rounded-3xl overflow-hidden"
                    style={{ background: 'linear-gradient(160deg,#0f1219,#141a26,#0f1219)' }}>

                    {/* Top bar */}
                    <div className="h-[3px]"
                        style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444,#ec4899,#a855f7)' }} />

                    {/* ── Hero ── */}
                    <div className="px-7 pt-7 pb-5 text-center"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

                        {/* Icon — smaller, contained */}
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-full"
                                style={{ border: '1.5px dashed rgba(245,158,11,0.22)', animation: 'spin-slow 10s linear infinite' }} />
                            <div className="absolute inset-[5px] rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg,rgba(245,158,11,0.14),rgba(239,68,68,0.09))',
                                    border: '1px solid rgba(245,158,11,0.28)',
                                    boxShadow: '0 0 20px rgba(245,158,11,0.15)'
                                }}>
                                <IoLockClosedOutline size={22} className="text-amber-400" />
                            </div>
                        </div>

                        {/* Status pill */}
                        <motion.div
                            initial={{ scale: 0.75, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.22, type: 'spring', stiffness: 280, damping: 18 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.26)' }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"
                                style={{ animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
                            <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Account Inactive</span>
                        </motion.div>

                        {/* Greeting */}
                        <motion.h1
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            className="text-2xl font-black text-white mb-1.5"
                        >
                            Hi {firstName}! 👋
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.26 }}
                            className="text-sm font-bold mb-2.5 inactive-shimmer"
                        >
                            Your membership is currently paused.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.33 }}
                            className="text-gray-400 text-xs leading-relaxed"
                        >
                            Your account has been deactivated. Contact the admin
                            to restore access to your seat, attendance and study tools.
                        </motion.p>
                    </div>

                    {/* ── Features ── */}
                    <div className="px-7 py-4"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2.5">
                            What you get on re-activation
                        </p>
                        <div className="flex flex-col gap-1.5">
                            {[
                                { icon: IoTrophyOutline, text: 'Access to your assigned seat & shift',       color: '#f59e0b', delay: 0.40 },
                                { icon: IoFlashOutline,  text: 'AI doubt solving & mock test generator',     color: '#a855f7', delay: 0.46 },
                                { icon: IoRocketOutline, text: 'Attendance tracking & monthly reports',      color: '#3b82f6', delay: 0.52 },
                                { icon: IoLibraryOutline,text: 'All previous data preserved and restored',   color: '#10b981', delay: 0.58 },
                            ].map((f, i) => <Feature key={i} {...f} />)}
                        </div>
                    </div>

                    {/* ── CTA ── */}
                    <div className="px-7 py-5">
                        <motion.a
                            href="https://www.apnalakshay.com/contact"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.66, type: 'spring', stiffness: 240, damping: 20 }}
                            whileHover={{ scale: 1.025, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            className="cta-glow w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-white mb-2.5"
                            style={{
                                background: 'linear-gradient(135deg,#d97706,#ef4444)',
                                textDecoration: 'none',
                                display: 'flex',
                            }}
                        >
                            <IoCallOutline size={16} />
                            Contact Admin to Re-Activate
                        </motion.a>

                        <motion.button
                            onClick={onLogout}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.74 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            <IoLogOutOutline size={13} />
                            Sign Out
                        </motion.button>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.82 }}
                            className="text-center text-[10px] text-gray-600 mt-3.5 flex items-center justify-center gap-1"
                        >
                            <IoTimeOutline size={11} />
                            Your attendance history and data are fully preserved
                        </motion.p>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default InactiveScreen;
