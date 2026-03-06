import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoGridOutline, IoDownload, IoClose } from 'react-icons/io5';

const PwaInstallBanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPwaPrompt || null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // If it was captured synchronously before React mounted, show immediately
        if (window.deferredPwaPrompt) {
            setDeferredPrompt(window.deferredPwaPrompt);
            setShowInstallBanner(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            window.deferredPwaPrompt = e;
            setDeferredPrompt(e);
            setShowInstallBanner(true);
        };

        const handleAppInstalled = () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
            window.deferredPwaPrompt = null;
        };

        // Even though we captured it globally in main.jsx, we also listen here
        // in case it fires while the app is already running
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Optional: If they already installed it or are in standalone mode, hide.
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallBanner(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        window.deferredPwaPrompt = null;
        setShowInstallBanner(false);
    };

    return (
        <AnimatePresence>
            {showInstallBanner && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 sm:bottom-6 left-0 sm:left-auto sm:right-6 w-full sm:w-[380px] z-[9999] p-4 sm:p-0 flex items-end justify-center sm:block pointer-events-none"
                >
                    <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl p-6 shadow-2xl shadow-orange-500/30 relative overflow-hidden w-full max-w-sm mx-auto border border-white/15 pointer-events-auto">
                        <button onClick={() => setShowInstallBanner(false)}
                            className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <IoClose size={18} />
                        </button>
                        <div className="flex gap-4 mb-5">
                            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                                <IoGridOutline className="text-white text-2xl" />
                            </div>
                            <div className="pt-0.5">
                                <h3 className="text-lg font-bold text-white mb-1">Install Apna Lakshay</h3>
                                <p className="text-orange-100 text-xs leading-relaxed">Faster loading, offline access, full app experience.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            {[['⚡', 'Fast'], ['📴', 'Offline'], ['📱', 'Native']].map(([icon, label]) => (
                                <div key={label} className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center">
                                    <span className="text-lg">{icon}</span>
                                    <span className="text-[10px] font-semibold text-white uppercase tracking-wider">{label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleInstallClick}
                                className="flex-1 bg-white text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg active:scale-95 transition-transform">
                                <IoDownload size={18} /> Install App
                            </button>
                            <button onClick={() => setShowInstallBanner(false)}
                                className="px-4 py-3 text-white/80 font-semibold hover:bg-white/10 rounded-xl transition-colors text-sm">
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
