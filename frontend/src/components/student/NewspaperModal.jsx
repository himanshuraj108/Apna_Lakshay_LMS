import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoNewspaper, IoOpenOutline, IoArrowBack, IoChevronForward } from 'react-icons/io5';

const NEWSPAPERS = {
    english: [
        {
            name: 'Times of India',
            desc: "India's most-read English daily",
            emoji: '🗞️',
            color: 'from-red-500 to-rose-500',
            border: 'border-red-200',
            bg: 'bg-red-50',
            text: 'text-red-600',
            url: 'https://epaper.indiatimes.com',
        },
        {
            name: 'Hindustan Times',
            desc: 'Leading English newspaper',
            emoji: '📰',
            color: 'from-blue-500 to-indigo-500',
            border: 'border-blue-200',
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            url: 'https://epaper.hindustantimes.com',
        },
        {
            name: 'The Hindu',
            desc: 'Quality journalism since 1878',
            emoji: '📄',
            color: 'from-sky-500 to-cyan-500',
            border: 'border-sky-200',
            bg: 'bg-sky-50',
            text: 'text-sky-600',
            url: 'https://epaper.thehindu.com',
        },
        {
            name: 'Indian Express',
            desc: 'Fearless & independent news',
            emoji: '🗒️',
            color: 'from-violet-500 to-purple-500',
            border: 'border-violet-200',
            bg: 'bg-violet-50',
            text: 'text-violet-600',
            url: 'https://epaper.indianexpress.com',
        },
    ],
    hindi: [
        {
            name: 'दैनिक भास्कर',
            desc: 'भारत का सबसे बड़ा हिंदी अखबार',
            emoji: '📋',
            color: 'from-orange-500 to-amber-500',
            border: 'border-orange-200',
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            url: 'https://www.bhaskar.com/epaper',
        },
        {
            name: 'हिन्दुस्तान',
            desc: 'विश्वसनीय हिंदी समाचार',
            emoji: '🗞️',
            color: 'from-emerald-500 to-green-500',
            border: 'border-emerald-200',
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            url: 'https://epaper.livehindustan.com',
        },
        {
            name: 'दैनिक जागरण',
            desc: 'देश का अग्रणी समाचार पत्र',
            emoji: '📰',
            color: 'from-yellow-500 to-amber-400',
            border: 'border-yellow-200',
            bg: 'bg-yellow-50',
            text: 'text-yellow-600',
            url: 'https://epaper.jagran.com',
        },
        {
            name: 'अमर उजाला',
            desc: 'उत्तर भारत का प्रमुख अखबार',
            emoji: '📄',
            color: 'from-pink-500 to-rose-500',
            border: 'border-pink-200',
            bg: 'bg-pink-50',
            text: 'text-pink-600',
            url: 'https://epaper.amarujala.com',
        },
    ],
};

const StepDots = ({ step }) => (
    <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-gradient-to-r from-orange-400 to-orange-500' : s < step ? 'w-4 bg-orange-400' : 'w-4 bg-gray-200'
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: 'spring', duration: 0.45 }}
                className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-orange-500/5 blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button onClick={handleBack} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all">
                                <IoArrowBack size={18} />
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
                                <IoNewspaper size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Daily Newspaper</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {step === 1 ? 'Step 1 — Choose your language' : `Step 2 — Choose ${lang === 'english' ? 'English' : 'Hindi'} newspaper`}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
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
                                <p className="text-gray-500 text-sm text-center mb-6 font-medium">Which language would you like to read?</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* English */}
                                    <motion.button
                                        whileHover={{ scale: 1.03, y: -4 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleLang('english')}
                                        className="group relative flex flex-col items-center gap-5 p-8 rounded-2xl bg-gradient-to-b from-blue-50 to-white border border-blue-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl shadow-sm">
                                            A
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-900 font-bold text-xl">English</p>
                                            <p className="text-blue-500 text-xs mt-1.5 font-medium">TOI · HT · The Hindu · IE</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-all">
                                            <IoChevronForward className="text-blue-600" size={16} />
                                        </div>
                                    </motion.button>

                                    {/* Hindi */}
                                    <motion.button
                                        whileHover={{ scale: 1.03, y: -4 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleLang('hindi')}
                                        className="group relative flex flex-col items-center gap-5 p-8 rounded-2xl bg-gradient-to-b from-orange-50 to-white border border-orange-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-amber-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl shadow-sm">
                                            अ
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-900 font-bold text-xl">हिन्दी</p>
                                            <p className="text-orange-500 text-xs mt-1.5 font-medium">भास्कर · जागरण · हिंदुस्तान</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-all">
                                            <IoChevronForward className="text-orange-600" size={16} />
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2 — Newspaper list */}
                        {step === 2 && lang && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                                <p className="text-gray-500 text-sm text-center mb-5">
                                    Select a newspaper — it will open on the <span className="text-gray-900 font-bold">official website</span> ↗
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
                                            className={`group relative flex items-center gap-4 p-4 rounded-xl ${paper.bg} border ${paper.border} hover:shadow-md transition-all duration-250 cursor-pointer`}
                                        >
                                            <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${paper.color} rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${paper.color} flex items-center justify-center text-2xl shadow-sm shrink-0 text-white`}>
                                                {paper.emoji}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-gray-900 font-bold text-base">{paper.name}</p>
                                                <p className={`text-xs mt-0.5 font-medium ${paper.text}`}>{paper.desc}</p>
                                            </div>
                                            <div className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-white border ${paper.border} ${paper.text} group-hover:scale-105 transition-transform shadow-sm`}>
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
