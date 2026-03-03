import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoClose, IoDownloadOutline, IoCheckmarkCircle,
    IoNotificationsOutline, IoFlashOutline, IoSpeedometerOutline, IoAppsOutline
} from 'react-icons/io5';

const STORAGE_KEY = 'pwa_prompt_dismissed_at';
const DISMISS_DAYS = 7; // Re-show after 7 days

const BENEFITS = [
    { icon: IoFlashOutline, text: 'Instant access — no browser needed' },
    { icon: IoNotificationsOutline, text: 'Get notified about fee dues & seat updates' },
    { icon: IoSpeedometerOutline, text: 'Faster performance with offline support' },
    { icon: IoAppsOutline, text: 'Looks and feels like a native app' },
];

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Don't show if already running as standalone PWA
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        if (isStandalone) return;

        // Don't show if dismissed recently
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        if (dismissedAt) {
            const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
            if (daysSince < DISMISS_DAYS) return;
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Small delay so user is settled on the page
            setTimeout(() => setShow(true), 2500);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        setInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstalled(true);
            setTimeout(() => setShow(false), 2000);
        } else {
            setInstalling(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="pwa-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
                        onClick={handleDismiss}
                    />

                    {/* Card */}
                    <motion.div
                        key="pwa-card"
                        initial={{ opacity: 0, y: 60, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 z-[9999] w-full max-w-sm sm:max-w-md"
                    >
                        <div
                            className="relative w-full rounded-t-3xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                            style={{ background: 'linear-gradient(160deg, rgba(14,14,24,0.99) 0%, rgba(20,20,36,0.99) 100%)' }}
                        >
                            {/* Top accent bar */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" />
                            {/* Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-violet-500/10 blur-3xl pointer-events-none" />

                            {/* Drag handle (mobile) */}
                            <div className="flex justify-center pt-3 pb-0 sm:hidden">
                                <div className="w-10 h-1 bg-white/20 rounded-full" />
                            </div>

                            {/* Close */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/12 border border-white/8 text-gray-400 hover:text-white transition-all"
                            >
                                <IoClose size={18} />
                            </button>

                            <div className="px-6 pt-6 pb-7">
                                {installed ? (
                                    /* Success state */
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-6"
                                    >
                                        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <IoCheckmarkCircle size={34} className="text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">App Installed!</h3>
                                        <p className="text-sm text-gray-500">You can now launch it from your home screen.</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* App icon + title */}
                                        <div className="text-center mb-5">
                                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-500/30">
                                                <IoDownloadOutline size={30} className="text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white leading-tight">
                                                Install Apna Lakshay
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">for the complete experience</p>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px bg-white/6 mb-4" />

                                        {/* Benefits */}
                                        <ul className="space-y-3 mb-6">
                                            {BENEFITS.map(({ icon: Icon, text }, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 + i * 0.08 }}
                                                    className="flex items-center gap-3 text-sm text-gray-300"
                                                >
                                                    <div className="w-7 h-7 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center shrink-0">
                                                        <Icon size={14} className="text-violet-400" />
                                                    </div>
                                                    {text}
                                                </motion.li>
                                            ))}
                                        </ul>

                                        {/* CTA */}
                                        <button
                                            onClick={handleInstall}
                                            disabled={installing}
                                            className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-base"
                                        >
                                            {installing ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <IoDownloadOutline size={18} />
                                            )}
                                            {installing ? 'Installing…' : 'Install App Now'}
                                        </button>

                                        <button
                                            onClick={handleDismiss}
                                            className="w-full mt-2.5 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            Maybe later
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
