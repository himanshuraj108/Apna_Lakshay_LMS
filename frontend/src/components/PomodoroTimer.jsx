import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoPlay, IoPause, IoRefresh, IoTime, IoCafe, IoSettings, IoClose, IoSave, IoReload } from 'react-icons/io5';
import api from '../utils/api';
import Button from './ui/Button';

const PomodoroTimer = ({ onSessionComplete }) => {
    // Default Values
    const DEFAULTS = {
        focus: 25,
        short_break: 5,
        long_break: 15
    };

    // Default Settings
    const [settings, setSettings] = useState(DEFAULTS);

    // Timer Modes
    const MODES = {
        focus: { time: settings.focus * 60, label: 'Focus Time', color: 'text-red-500', bg: 'bg-red-500' },
        short_break: { time: settings.short_break * 60, label: 'Short Break', color: 'text-green-500', bg: 'bg-green-500' },
        long_break: { time: settings.long_break * 60, label: 'Long Break', color: 'text-blue-500', bg: 'bg-blue-500' }
    };

    const [mode, setMode] = useState('focus');
    const [timeLeft, setTimeLeft] = useState(MODES.focus.time);
    const [isActive, setIsActive] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [tempSettings, setTempSettings] = useState(settings);

    // Initialization flag to prevent overwriting saved state on mount
    const [isInitialized, setIsInitialized] = useState(false);

    const timerRef = useRef(null);
    const persistenceKey = 'pomodoroState'; // Key for saving timer state

    // Audio Refs
    const audioStart = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const audioEnd = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    // 1. Load Settings & Persistence on Mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(parsed);
            setTempSettings(parsed);
        }

        const savedState = localStorage.getItem(persistenceKey);
        if (savedState) {
            const { mode: savedMode, isActive: savedIsActive, endTime, timeLeft: savedTimeLeft } = JSON.parse(savedState);
            setMode(savedMode || 'focus');

            if (savedIsActive && endTime) {
                const now = Date.now();
                const remaining = Math.ceil((endTime - now) / 1000);

                if (remaining > 0) {
                    setTimeLeft(remaining);
                    setIsActive(true);
                } else {
                    setTimeLeft(0);
                    setIsActive(false);
                }
            } else {
                setIsActive(false);
                setTimeLeft(savedTimeLeft || (savedSettings ? JSON.parse(savedSettings)[savedMode] * 60 : DEFAULTS[savedMode || 'focus'] * 60));
            }
        }

        setIsInitialized(true); // Mark as loaded
    }, []);

    // 2. Timer Loop
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    const newValue = prev - 1;
                    return newValue >= 0 ? newValue : 0;
                });
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handleTimerComplete();
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    // 3. Update Progress & Persist State (Only after initialization)
    useEffect(() => {
        if (!isInitialized) return; // Don't save until loaded

        const totalTime = MODES[mode].time;
        if (totalTime > 0) {
            setProgress(((totalTime - timeLeft) / totalTime) * 100);
        }

        const stateToSave = {
            mode,
            isActive,
            timeLeft,
            endTime: isActive ? Date.now() + (timeLeft * 1000) : null
        };
        localStorage.setItem(persistenceKey, JSON.stringify(stateToSave));

    }, [timeLeft, mode, isActive, settings, isInitialized]);

    const handleTimerComplete = async () => {
        setIsActive(false);
        audioEnd.play();

        if (mode === 'focus') {
            try {
                await api.post('/study/pomodoro', {
                    duration: settings.focus,
                    type: 'focus'
                });
                if (onSessionComplete) onSessionComplete();
            } catch (error) {
                console.error('Failed to log session:', error);
            }
        }

        if (Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: `${MODES[mode].label} is over.`
            });
        }
    };

    const toggleTimer = () => {
        if (!isActive) {
            audioStart.play();
            if (Notification.permission !== 'granted') {
                Notification.requestPermission();
            }
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode].time);
        setProgress(0);
        localStorage.removeItem(persistenceKey);
    };

    const changeMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(settings[newMode] * 60);
        setProgress(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSaveSettings = () => {
        setSettings(tempSettings);
        localStorage.setItem('pomodoroSettings', JSON.stringify(tempSettings));
        setShowSettings(false);

        setIsActive(false);
        setTimeLeft(tempSettings[mode] * 60);
        setProgress(0);
    };

    const handleResetDefaults = () => {
        setTempSettings(DEFAULTS);
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
            <div className={`absolute -top-20 -right-20 w-40 h-40 ${MODES[mode].bg} opacity-20 blur-[50px] transition-colors duration-500`}></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex gap-2">
                    {Object.keys(MODES).map((m) => (
                        <button
                            key={m}
                            onClick={() => changeMode(m)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${mode === m
                                ? `${MODES[m].bg} text-white shadow-lg`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {MODES[m].label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <IoSettings size={20} />
                </button>
            </div>

            <div className="relative flex items-center justify-center mb-8">
                <svg className="w-64 h-64 -rotate-90 transform">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-100"
                    />
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                        className={`${MODES[mode].color} transition-all duration-1000 ease-linear`}
                        strokeLinecap="round"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        key={timeLeft}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-6xl font-bold font-mono tracking-tighter ${MODES[mode].color}`}
                    >
                        {formatTime(timeLeft)}
                    </motion.div>
                    <p className="text-gray-500 mt-2 font-medium tracking-widest uppercase text-xs">
                        {isActive ? 'Running' : 'Paused'}
                    </p>
                </div>
            </div>

            <div className="flex justify-center gap-4 relative z-10">
                <Button
                    onClick={toggleTimer}
                    className={`w-16 h-16 !rounded-full flex items-center justify-center text-2xl shadow-lg transition-transform active:scale-95 ${isActive ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : `${MODES[mode].bg} hover:opacity-90`}`}
                >
                    {isActive ? <IoPause /> : <IoPlay className="ml-1" />}
                </Button>

                <Button
                    onClick={resetTimer}
                    variant="secondary"
                    className="w-16 h-16 !rounded-full flex items-center justify-center text-2xl"
                >
                    <IoRefresh />
                </Button>
            </div>

            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <IoSettings /> Settings
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-900">
                                <IoClose size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Focus Time (minutes)</label>
                                <input
                                    type="number"
                                    value={tempSettings.focus}
                                    onChange={(e) => setTempSettings({ ...tempSettings, focus: parseInt(e.target.value) || 25 })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                                    min="1" max="180"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Short Break (minutes)</label>
                                <input
                                    type="number"
                                    value={tempSettings.short_break}
                                    onChange={(e) => setTempSettings({ ...tempSettings, short_break: parseInt(e.target.value) || 5 })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-green-500"
                                    min="1" max="60"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Long Break (minutes)</label>
                                <input
                                    type="number"
                                    value={tempSettings.long_break}
                                    onChange={(e) => setTempSettings({ ...tempSettings, long_break: parseInt(e.target.value) || 15 })}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 outline-none focus:border-blue-500"
                                    min="1" max="60"
                                />
                            </div>

                            <button
                                onClick={handleResetDefaults}
                                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-2 underline"
                            >
                                <IoReload /> Reset to defaults
                            </button>
                        </div>

                        <Button onClick={handleSaveSettings} variant="primary" className="w-full mt-4 flex items-center justify-center gap-2">
                            <IoSave /> Save Settings
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PomodoroTimer;
