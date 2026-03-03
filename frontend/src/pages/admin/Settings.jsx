import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { IoSettings, IoPower, IoTime, IoSave, IoCheckmarkCircle } from 'react-icons/io5';
import ShiftManager from '../../components/admin/ShiftManager';

const PAGE_BG = { background: '#050508' };
const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all";

const Settings = () => {
    const [settings, setSettings] = useState({ shiftMode: 'default', systemStatus: 'active' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('default');

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.success) setSettings(res.data.settings);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (newSettings = settings) => {
        setSaving(true);
        try {
            const res = await api.put('/settings', newSettings);
            if (res.data.success) {
                setSettings(res.data.settings);
                setSuccessMessage('Settings updated!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (e) { alert('Failed to update settings'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={PAGE_BG}>
            <div className="animate-pulse text-gray-500">Loading settings…</div>
        </div>
    );

    const TABS = [
        { key: 'default', label: 'Default Config', color: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.3)' },
        { key: 'custom', label: 'Custom Config', color: 'from-green-500 to-teal-500', glow: 'rgba(16,185,129,0.3)' },
    ];

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-6%] w-[500px] h-[500px] rounded-full bg-purple-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] right-[-6%] w-[400px] h-[400px] rounded-full bg-blue-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/30">
                        <IoSettings size={20} className="text-white" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Admin</span>
                        <h1 className="text-2xl sm:text-3xl font-black text-white leading-none">System Configuration</h1>
                    </div>
                </motion.div>

                {/* System Status */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${settings.systemStatus === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            <IoPower size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-sm">System Status</h2>
                            <p className="text-xs text-gray-500">{settings.systemStatus === 'active' ? 'System is Online' : 'Maintenance Mode Active'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['active', 'maintenance'].map(s => (
                            <button key={s} onClick={() => handleSave({ ...settings, systemStatus: s })}
                                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all capitalize ${settings.systemStatus === s
                                    ? s === 'active' ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' : 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-4">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key
                                ? `bg-gradient-to-r ${t.color} text-white shadow-lg`
                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-6 min-h-[400px]">

                    {activeTab === 'default' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" />
                                        <h2 className="font-bold text-white">Default Logic</h2>
                                    </div>
                                    <p className="text-sm text-gray-500 max-w-md">Fixed hardcoded shifts — the fail-safe mode for standard operations.</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSave({ ...settings, shiftMode: 'default' })}
                                    disabled={settings.shiftMode === 'default'}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${settings.shiftMode === 'default'
                                        ? 'bg-white/5 border border-white/10 text-gray-500 cursor-default'
                                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'}`}>
                                    {settings.shiftMode === 'default' ? '✓ Currently Active' : 'Activate Default Mode'}
                                </motion.button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                {[
                                    { name: 'Morning', time: '09:00 – 15:00', price: '₹800', color: 'from-blue-400 to-cyan-400' },
                                    { name: 'Evening', time: '15:00 – 21:00', price: '₹800', color: 'from-purple-400 to-violet-400' },
                                    { name: 'Full Day', time: '09:00 – 21:00', price: '₹1200', color: 'from-green-400 to-emerald-400' },
                                ].map(s => (
                                    <div key={s.name} className="bg-white/5 border border-white/8 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`font-bold text-sm bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.name}</span>
                                            <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-md">{s.time}</span>
                                        </div>
                                        <p className="text-2xl font-black text-white">{s.price}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 block" />
                                        <h2 className="font-bold text-white">Custom Logic</h2>
                                    </div>
                                    <p className="text-sm text-gray-500 max-w-md">Dynamic shifts — flexible timing for unlimited configurations.</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSave({ ...settings, shiftMode: 'custom' })}
                                    disabled={settings.shiftMode === 'custom'}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${settings.shiftMode === 'custom'
                                        ? 'bg-white/5 border border-white/10 text-gray-500 cursor-default'
                                        : 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg shadow-green-500/25'}`}>
                                    {settings.shiftMode === 'custom' ? '✓ Currently Active' : 'Activate Custom Mode'}
                                </motion.button>
                            </div>
                            <ShiftManager />
                        </div>
                    )}
                </motion.div>

                {/* Save Button */}
                <div className="flex justify-end mt-4">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSave()} disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all">
                        <IoSave size={16} /> {saving ? 'Saving…' : 'Save Configuration'}
                    </motion.button>
                </div>

                {/* Success Toast */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                            className="fixed bottom-8 right-8 flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">
                            <IoCheckmarkCircle size={18} /> {successMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Settings;
