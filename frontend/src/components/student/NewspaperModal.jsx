import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoNewspaper, IoOpenOutline, IoArrowBack, IoChevronForward } from 'react-icons/io5';

const NEWSPAPERS = {
    english: [
        {
            name: 'Times of India',
            desc: 'India\'s most-read English daily',
            emoji: '🗞️',
            color: 'from-red-600 to-rose-700',
            border: 'border-red-500/30',
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            url: 'https://epaper.indiatimes.com',
        },
        {
            name: 'Hindustan Times',
            desc: 'Leading English newspaper',
            emoji: '📰',
            color: 'from-blue-600 to-indigo-700',
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            url: 'https://epaper.hindustantimes.com',
        },
        {
            name: 'The Hindu',
            desc: 'Quality journalism since 1878',
            emoji: '📄',
            color: 'from-sky-600 to-cyan-700',
            border: 'border-sky-500/30',
            bg: 'bg-sky-500/10',
            text: 'text-sky-400',
            url: 'https://epaper.thehindu.com',
        },
        {
            name: 'Indian Express',
            desc: 'Fearless & independent news',
            emoji: '🗒️',
            color: 'from-violet-600 to-purple-700',
            border: 'border-violet-500/30',
            bg: 'bg-violet-500/10',
            text: 'text-violet-400',
            url: 'https://epaper.indianexpress.com',
        },
    ],
    hindi: [
        {
            name: 'दैनिक भास्कर',
            desc: 'भारत का सबसे बड़ा हिंदी अखबार',
            emoji: '📋',
            color: 'from-orange-500 to-amber-600',
            border: 'border-orange-500/30',
            bg: 'bg-orange-500/10',
            text: 'text-orange-400',
            url: 'https://www.bhaskar.com/epaper',
        },
        {
            name: 'हिन्दुस्तान',
            desc: 'विश्वसनीय हिंदी समाचार',
            emoji: '🗞️',
            color: 'from-green-600 to-emerald-700',
            border: 'border-green-500/30',
            bg: 'bg-green-500/10',
            text: 'text-green-400',
            url: 'https://epaper.livehindustan.com',
        },
        {
            name: 'दैनिक जागरण',
            desc: 'देश का अग्रणी समाचार पत्र',
            emoji: '📰',
            color: 'from-yellow-500 to-amber-500',
            border: 'border-yellow-500/30',
            bg: 'bg-yellow-500/10',
            text: 'text-yellow-400',
            url: 'https://epaper.jagran.com',
        },
        {
            name: 'अमर उजाला',
            desc: 'उत्तर भारत का प्रमुख अखबार',
            emoji: '📄',
            color: 'from-pink-600 to-rose-600',
            border: 'border-pink-500/30',
            bg: 'bg-pink-500/10',
            text: 'text-pink-400',
            url: 'https://epaper.amarujala.com',
        },
    ],
};

// Step indicator
const StepDots = ({ step }) => (
    <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-gradient-to-r from-purple-500 to-blue-500' : s < step ? 'w-4 bg-green-500' : 'w-4 bg-white/15'
                }`} />
        ))}
    </div>
);

const NewspaperModal = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [lang, setLang] = useState(null);

    const handleLang = (l) => { setLang(l); setStep(2); };
    const handleBack = () => { setStep(1); setLang(null); };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: 'spring', duration: 0.45 }}
                className="relative w-full max-w-2xl bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-orange-400" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-purple-500/8 blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button onClick={handleBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                <IoArrowBack size={18} />
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400">
                                <IoNewspaper size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Daily Newspaper</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {step === 1 ? 'Step 1 — Choose your language' : `Step 2 — Choose ${lang === 'english' ? 'English' : 'Hindi'} newspaper`}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all">
                        <IoClose size={22} />
                    </button>
                </div>

                <div className="px-6 shrink-0"><StepDots step={step} /></div>

                {/* Content */}
                <div className="overflow-y-auto px-6 pb-6">
                    <AnimatePresence mode="wait">

                        {/* Step 1 — Language */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                                <p className="text-gray-400 text-sm text-center mb-6">Which language would you like to read?</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* English */}
                                    <motion.button
                                        whileHover={{ scale: 1.03, y: -4 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleLang('english')}
                                        className="group relative flex flex-col items-center gap-5 p-8 rounded-2xl bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-5xl">🇬🇧</span>
                                        <div className="text-center">
                                            <p className="text-white font-bold text-xl">English</p>
                                            <p className="text-blue-400 text-xs mt-1.5">TOI · HT · The Hindu · IE</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/40 transition-all">
                                            <IoChevronForward className="text-blue-400" size={16} />
                                        </div>
                                    </motion.button>

                                    {/* Hindi */}
                                    <motion.button
                                        whileHover={{ scale: 1.03, y: -4 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleLang('hindi')}
                                        className="group relative flex flex-col items-center gap-5 p-8 rounded-2xl bg-gradient-to-b from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-400/60 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-5xl">🇮🇳</span>
                                        <div className="text-center">
                                            <p className="text-white font-bold text-xl">हिन्दी</p>
                                            <p className="text-orange-400 text-xs mt-1.5">भास्कर · जागरण · हिंदुस्तान</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/40 transition-all">
                                            <IoChevronForward className="text-orange-400" size={16} />
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2 — Newspaper list */}
                        {step === 2 && lang && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                                <p className="text-gray-400 text-sm text-center mb-5">
                                    Select a newspaper — it will open on the <span className="text-white font-medium">official website</span> ↗
                                </p>
                                <div className="flex flex-col gap-3">
                                    {NEWSPAPERS[lang].map((paper, i) => (
                                        <motion.a
                                            key={paper.name}
                                            href={paper.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`group relative flex items-center gap-4 p-4 rounded-xl ${paper.bg} border ${paper.border} hover:shadow-xl transition-all duration-250 cursor-pointer`}
                                        >
                                            <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${paper.color} rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${paper.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                                                {paper.emoji}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-white font-semibold text-base">{paper.name}</p>
                                                <p className={`text-xs mt-0.5 ${paper.text}`}>{paper.desc}</p>
                                            </div>
                                            <div className={`shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg ${paper.bg} border ${paper.border} ${paper.text} group-hover:scale-105 transition-transform`}>
                                                <IoOpenOutline size={14} />
                                                Open
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default NewspaperModal;
