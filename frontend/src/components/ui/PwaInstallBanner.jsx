import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoDownload, IoClose,
    IoFlashOutline, IoCloudOfflineOutline, IoPhonePortraitOutline,
    IoSparkles, IoInformationCircleOutline
} from 'react-icons/io5';

const SNOOZE_STORAGE_KEY = 'pwa_banner_snooze_until';
const SNOOZE_DURATION_MS = 2 * 60 * 1000; // 2 minutes

const isInstalled = () => {
    if (typeof window === 'undefined') return true;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        localStorage.getItem('pwa_app_installed') === 'true'
    );
};

const PwaInstallBanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPwaPrompt || null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [hint, setHint] = useState('');
    const timerRef = useRef(null);

    useEffect(() => {
        if (isInstalled()) return;

        const now = Date.now();
        const snoozeUntil = Number(localStorage.getItem(SNOOZE_STORAGE_KEY) || 0);

        if (snoozeUntil > now) {
            // Still in the 2-minute snooze window from clicking "Later"
            const remaining = snoozeUntil - now;
            timerRef.current = setTimeout(() => {
                if (!isInstalled()) {
                    setShowInstallBanner(true);
                }
            }, remaining);
        } else {
            // Snooze expired or first visit — show after 2 seconds
            timerRef.current = setTimeout(() => {
                if (!isInstalled()) {
                    setShowInstallBanner(true);
                }
            }, 2000);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            window.deferredPwaPrompt = e;
            setDeferredPrompt(e);

            // Only show if not currently snoozed
            const currentSnooze = Number(localStorage.getItem(SNOOZE_STORAGE_KEY) || 0);
            if (Date.now() >= currentSnooze && !isInstalled()) {
                setShowInstallBanner(true);
            }
        };

        const handleAppInstalled = () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
            window.deferredPwaPrompt = null;
            try {
                localStorage.setItem('pwa_app_installed', 'true');
            } catch (err) {}
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const dismissPrompt = () => {
        setShowInstallBanner(false);

        // Snooze for exactly 2 minutes (persists in localStorage across page reloads)
        const snoozeUntil = Date.now() + SNOOZE_DURATION_MS;
        try {
            localStorage.setItem(SNOOZE_STORAGE_KEY, snoozeUntil.toString());
        } catch (e) {}

        // Schedule re-appearance after 2 minutes
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (!isInstalled()) {
                setShowInstallBanner(true);
            }
        }, SNOOZE_DURATION_MS);
    };

    const handleInstallClick = async () => {
        const promptToUse = deferredPrompt || window.deferredPwaPrompt;
        if (promptToUse) {
            promptToUse.prompt();
            try {
                const { outcome } = await promptToUse.userChoice;
                if (outcome === 'accepted') {
                    setShowInstallBanner(false);
                    try {
                        localStorage.setItem('pwa_app_installed', 'true');
                    } catch (e) {}
                }
            } catch (err) {
                console.error('PWA install error:', err);
            }
            setDeferredPrompt(null);
            window.deferredPwaPrompt = null;
        } else {
            setHint('Click the install icon in your browser address bar or menu to install.');
            setTimeout(() => setHint(''), 6000);
        }
    };

    return (
        <AnimatePresence>
            {showInstallBanner && (
                <motion.div
                    initial={{ y: 80, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 80, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="fixed bottom-4 sm:bottom-6 left-0 sm:left-6 w-full sm:w-[390px] z-[9999] p-3 sm:p-0 flex items-end justify-center sm:block pointer-events-none"
                    style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
                >
                    <div
                        className="relative overflow-hidden w-full max-w-sm mx-auto rounded-3xl p-5 pointer-events-auto border"
                        style={{
                            background: 'linear-gradient(145deg, #1C150E 0%, #2A1D13 60%, #1A120C 100%)',
                            borderColor: 'rgba(249,115,22,0.35)',
                            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5), 0 0 35px -5px rgba(249,115,22,0.25)',
                        }}
                    >
                        {/* Top subtle orange accent strip */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[3px]"
                            style={{ background: 'linear-gradient(90deg, #F97316, #FB923C, #FDBA74)' }}
                        />

                        {/* Ambient warm glow in top-right */}
                        <div
                            className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
                            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)', filter: 'blur(20px)' }}
                        />

                        {/* Close button */}
                        <button
                            onClick={dismissPrompt}
                            aria-label="Close"
                            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer text-orange-200/70 hover:text-white"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <IoClose size={17} />
                        </button>

                        {/* Header: Icon + Title */}
                        <div className="flex items-center gap-3.5 mb-4 pr-7">
                            <img
                                src="/app-icon-192.png"
                                alt="Apna Lakshay"
                                className="w-12 h-12 rounded-2xl object-cover shrink-0"
                                style={{
                                    boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                                }}
                            />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-[15px] font-black text-white leading-snug tracking-tight">
                                        Install Apna Lakshay
                                    </h3>
                                    <IoSparkles className="text-amber-400 text-xs shrink-0" />
                                </div>
                                <p className="text-xs text-orange-200/80 leading-snug mt-0.5 font-medium">
                                    Faster loading, offline access, full app experience.
                                </p>
                            </div>
                        </div>

                        {/* Benefit chips */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                                { icon: <IoFlashOutline size={16} />, label: 'Fast' },
                                { icon: <IoCloudOfflineOutline size={16} />, label: 'Offline' },
                                { icon: <IoPhonePortraitOutline size={16} />, label: 'Native' },
                            ].map(({ icon, label }) => (
                                <div
                                    key={label}
                                    className="rounded-xl p-2 flex flex-col items-center gap-1 text-center"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(249,115,22,0.12)',
                                    }}
                                >
                                    <div className="text-orange-400">{icon}</div>
                                    <span className="text-[10px] font-bold text-orange-100 uppercase tracking-wider">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Hint notice if browser needs manual menu click */}
                        {hint && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-3 p-2.5 rounded-xl text-xs text-amber-200 flex items-center gap-2"
                                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                            >
                                <IoInformationCircleOutline size={16} className="shrink-0 text-amber-400" />
                                <span>{hint}</span>
                            </motion.div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm text-white transition-all cursor-pointer active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                    boxShadow: '0 4px 18px rgba(249,115,22,0.38)',
                                }}
                            >
                                <IoDownload size={16} />
                                <span>Install App</span>
                            </button>
                            <button
                                onClick={dismissPrompt}
                                className="px-3.5 py-2.5 text-xs font-semibold text-orange-200/70 hover:text-white rounded-xl transition-colors cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.04)' }}
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PwaInstallBanner;
