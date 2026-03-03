import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCopy, IoCheckmark, IoMail, IoLockClosed, IoPerson, IoSchool } from 'react-icons/io5';

export default function CredentialPopup({ user, password, onClose }) {
    const [copied, setCopied] = useState('');

    const copy = async (text, key) => {
        await navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 1800);
    };

    const fields = [
        { key: 'name', icon: <IoPerson size={15} />, label: 'Full Name', value: user?.name, color: '#f59e0b' },
        { key: 'email', icon: <IoMail size={15} />, label: 'Email / Login ID', value: user?.email, color: '#3b82f6', copyable: true },
        { key: 'password', icon: <IoLockClosed size={15} />, label: 'Password', value: password || '(contact admin)', color: '#8b5cf6', copyable: !!password },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                    className="relative w-full max-w-sm rounded-3xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(145deg, #0f172a, #0a0c1c)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.07)'
                    }}
                >
                    {/* Top gradient bar */}
                    <div className="h-1.5" style={{ background: 'linear-gradient(to right, #7c3aed, #3b82f6, #22c55e)' }} />

                    {/* Glow orbs */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }} />

                    <div className="relative p-6">
                        {/* Close */}
                        <button onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all z-10">
                            <IoClose size={18} />
                        </button>

                        {/* Header icon */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 relative"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 8px 30px rgba(124,58,237,0.5)' }}>
                                <IoSchool size={28} className="text-white" />
                                {/* Sparkle */}
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px]">✨</span>
                            </div>
                            <h2 className="text-white font-black text-xl tracking-tight">Login Successful!</h2>
                            <p className="text-gray-500 text-xs mt-1 text-center">Save these credentials. They're sent to your email too.</p>
                        </div>

                        {/* Credentials list */}
                        <div className="space-y-3 mb-5">
                            {fields.map(f => (
                                <div key={f.key} className="rounded-2xl px-4 py-3 relative overflow-hidden group"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span style={{ color: f.color }}>{f.icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">{f.label}</p>
                                                <p className="text-white text-sm font-semibold truncate" style={{ fontFamily: f.key === 'password' ? 'monospace' : undefined }}>
                                                    {f.value || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        {f.copyable && (
                                            <button onClick={() => copy(f.value, f.key)}
                                                className="ml-2 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                                style={{ background: copied === f.key ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                {copied === f.key
                                                    ? <IoCheckmark size={15} className="text-green-400" />
                                                    : <IoCopy size={14} className="text-gray-500 hover:text-white transition-colors" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Warning note */}
                        <div className="rounded-xl px-3 py-2.5 mb-4 text-xs text-amber-400 flex items-start gap-2"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                            <span className="text-base shrink-0 mt-0.5">⚠️</span>
                            <span>These credentials are shown <strong>only once</strong>. A copy has been sent to your registered email.</span>
                        </div>

                        {/* CTA */}
                        <button onClick={onClose}
                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
                            Got it, take me to dashboard →
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
