import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoWarning, IoSkull, IoNuclear, IoLockClosed } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const MaintenancePage = () => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes fake countdown
    const [breachLevel, setBreachLevel] = useState(0);
    const audioRef = useRef(null);

    // Fake Countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 0.1 : 0));
        }, 100);
        return () => clearInterval(timer);
    }, []);

    // Random "Breach" spikes
    useEffect(() => {
        const interval = setInterval(() => {
            setBreachLevel(Math.random() * 100);
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
    };

    const errors = [
        "CRITICAL_PROCESS_DIED",
        "KERNEL_SECURITY_CHECK_FAILURE",
        "SYSTEM_SERVICE_EXCEPTION",
        "IRQL_NOT_LESS_OR_EQUAL",
        "DATA_BUS_ERROR"
    ];

    return (
        <div className="h-screen w-screen bg-black text-red-600 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden select-none cursor-not-allowed overscroll-none fixed inset-0">

            {/* CRT Scanline & flicker effect */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute inset-0 z-50 pointer-events-none" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}></div>

            {/* Red Strobe */}
            <motion.div
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-red-900/40 z-0 pointer-events-none mix-blend-overlay"
            />

            {/* Falling Code (Matrix style but red and chaotic) */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ top: -100, left: `${Math.random() * 100}%` }}
                        animate={{ top: '100%' }}
                        transition={{
                            duration: Math.random() * 2 + 1,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 2
                        }}
                        className="absolute text-xs vertical-text font-bold text-red-500/50"
                        style={{ writingMode: 'vertical-rl' }}
                    >
                        {Array.from({ length: 20 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
                    </motion.div>
                ))}
            </div>

            {/* Main Content Wrapper with Shake */}
            <motion.div
                animate={{ x: [-2, 2, -1, 1, 0], y: [1, -1, 0] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="relative z-40 max-w-5xl w-full h-full flex flex-col justify-center py-4"
            >
                <div className="bg-red-600 text-black font-black text-center py-4 text-2xl md:text-4xl panic-strobe tracking-widest mb-4 border-y-4 border-black uppercase shadow-[0_0_30px_rgba(220,38,38,0.8)] z-50">
                    /// SERVER IN MAINTENANCE MODE ///
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center bg-black/95 border-2 border-red-600 p-4 md:p-8 shadow-[0_0_100px_rgba(220,38,38,0.4)] backdrop-blur-sm relative max-h-[85vh] overflow-hidden">

                    {/* Left Column: Visuals */}
                    <div className="text-center relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="inline-block relative"
                        >
                            <IoNuclear className="text-9xl text-red-600 opacity-80" />
                            <div className="absolute inset-0 border-4 border-dashed border-red-500 rounded-full animate-spin-reverse" style={{ animationDirection: 'reverse' }}></div>
                        </motion.div>

                        <div className="mt-8 relative overflow-hidden h-24 bg-red-950/30 border border-red-800 rounded p-2">
                            {/* Fake Waveform */}
                            <div className="flex items-end justify-center h-full gap-1">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: ["10%", `${Math.random() * 100}%`, "10%"] }}
                                        transition={{ duration: 0.2, repeat: Infinity }}
                                        className="w-2 bg-red-500"
                                    />
                                ))}
                            </div>
                            <div className="absolute top-1 left-2 text-xs text-red-400">CORE_TEMP_CRITICAL</div>
                        </div>
                    </div>

                    {/* Right Column: Text & Data */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mix-blend-difference glitch-layers relative leading-tight" data-text="TEMPORARY SERVICE UNAVAILABLE">
                                TEMPORARY SERVICE UNAVAILABLE
                            </h1>
                            <div className="h-1 w-full bg-red-600 mt-2"></div>
                        </div>

                        <div className="space-y-2 font-mono text-sm">
                            <div className="flex justify-between border-b border-red-900 pb-1">
                                <span>ERROR_CODE:</span>
                                <span className="animate-pulse">0xDEAD_BEEF</span>
                            </div>
                            <div className="flex justify-between border-b border-red-900 pb-1">
                                <span>SYSTEM_STATUS:</span>
                                <span className="text-red-500 font-bold blink">COMPROMISED</span>
                            </div>
                            <div className="flex justify-between border-b border-red-900 pb-1">
                                <span>ESTIMATED_DATA_LOSS:</span>
                                <span>{breachLevel.toFixed(2)}%</span>
                            </div>
                        </div>

                        {/* Self Destruct Timer */}
                        <div className="bg-red-900/20 p-2 border border-red-600 text-center">
                            <div className="text-[10px] text-red-400 mb-0">AUTOMATIC_PURGE_SEQUENCE</div>
                            <div className="text-4xl md:text-5xl font-black font-digital text-red-500 tracking-widest tabular-nums">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Terminal Log */}
                        <div className="h-24 md:h-32 overflow-hidden text-[10px] text-red-400/80 font-mono p-2 bg-black border border-red-900/50 flex flex-col justify-end">
                            {errors.slice(-4).map((err, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.8 }}
                                    className="mb-0.5 truncate"
                                >
                                    [{new Date().toLocaleTimeString().split(' ')[0]}] CRITICAL: {err}
                                </motion.div>
                            ))}
                            <div className="animate-pulse">_</div>
                        </div>
                    </div>

                    {/* Overlay Crosshairs */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-red-500"></div>
                    <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-red-500"></div>
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-red-500"></div>
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-red-500"></div>
                </div>

                <div className="text-center mt-12">
                    <Link to="/login?access=admin" className="inline-flex items-center gap-2 text-red-800 hover:text-red-500 transition-colors uppercase text-sm tracking-widest border border-transparent hover:border-900 px-4 py-2 opacity-50 hover:opacity-100">
                        <IoLockClosed /> Emergency Admin Override
                    </Link>
                </div>

            </motion.div>

            {/* CSS for digital font force and blink */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
                .font-digital { font-family: 'Share Tech Mono', monospace; }
                .blink { animation: blinker 0.1s linear infinite; }
                @keyframes blinker { 50% { opacity: 0; } }
                .glitch-layers { position: relative; }
                .glitch-layers:before, .glitch-layers:after {
                    content: attr(data-text);
                    position: absolute;
                    left: 0;
                    text-shadow: 1px 0 #00ffff;
                    top: 0;
                    color: white;
                    background: black;
                    overflow: hidden;
                    clip-path: inset(0 0 0 0);
                    animation: noise-anim-2 2s infinite linear alternate-reverse;
                }
                .glitch-layers:after {
                    text-shadow: -1px 0 #ff00ff;
                    animation: noise-anim 2s infinite linear alternate-reverse;
                }
                @keyframes noise-anim {
                    0% { clip-path: inset(10% 0 85% 0); transform: translate(-2px, 0); }
                    20% { clip-path: inset(85% 0 10% 0); transform: translate(2px, 0); }
                    40% { clip-path: inset(50% 0 30% 0); transform: translate(-2px, 0); }
                    100% { clip-path: inset(25% 0 55% 0); transform: translate(2px, 0); }
                }
                .panic-strobe { animation: panic 0.1s infinite; }
                @keyframes panic {
                    0% { background-color: #dc2626; color: black; border-color: black; }
                    50% { background-color: black; color: #dc2626; border-color: #dc2626; }
                    100% { background-color: #dc2626; color: black; border-color: black; }
                }
            `}</style>
        </div>
    );
};

export default MaintenancePage;
