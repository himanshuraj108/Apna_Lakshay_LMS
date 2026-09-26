import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { IoSettings, IoPower, IoTime, IoSave, IoCheckmarkCircle, IoLocationOutline, IoLogoWhatsapp, IoSparklesOutline, IoArrowBack, IoTimerOutline } from 'react-icons/io5';
import ShiftManager from '../../components/admin/ShiftManager';

const PAGE_BG = { background: '#FAF6F0' };
const INPUT = "w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-[#0F172A] text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder-slate-400 shadow-2xs";

const Settings = () => {
    const [settings, setSettings] = useState({ shiftMode: 'default', systemStatus: 'active', locationAttendance: true, showWhatsAppGroup: true, showAITools: true });
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
                setSuccessMessage('Settings updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (e) { alert('Failed to update settings'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={PAGE_BG}>
            <div className="animate-pulse text-stone-500 text-sm font-medium">Loading settings…</div>
        </div>
    );

    const TABS = [
        { key: 'default', label: 'Default Config' },
        { key: 'custom', label: 'Custom Config' },
    ];

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                                <IoArrowBack size={15} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                    <IoSettings size={14} />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">System Preferences</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] leading-tight">System Configuration</h1>
                        </div>
                    </div>
                </motion.div>

                {/* System Status */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${settings.systemStatus === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                            <IoPower size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0F172A] text-sm">System Status</h2>
                            <p className="text-xs text-stone-500 font-medium">{settings.systemStatus === 'active' ? 'System is Online & Active' : 'Maintenance Mode Active'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['active', 'maintenance'].map(s => (
                            <button key={s} onClick={() => handleSave({ ...settings, systemStatus: s })}
                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all capitalize cursor-pointer ${settings.systemStatus === s
                                    ? s === 'active' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                    : 'bg-white border border-[#EDE8E0] text-stone-700 hover:bg-[#FAF6F0]'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Additional Settings Row */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    {/* Location Attendance Toggle */}
                    <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${settings.locationAttendance !== false ? 'bg-orange-500/10 text-orange-600' : 'bg-stone-100 text-stone-400'}`}>
                                <IoLocationOutline size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#0F172A] text-xs">Location Attendance</h2>
                                <p className="text-[11px] text-stone-500 leading-snug mt-0.5">Require students to be physically present at the library.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave({ ...settings, locationAttendance: settings.locationAttendance === false ? true : false })}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 cursor-pointer ${settings.locationAttendance !== false ? 'bg-orange-500 shadow-md shadow-orange-500/20' : 'bg-stone-300'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.locationAttendance !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* WhatsApp Group Banner Toggle */}
                    <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${settings.showWhatsAppGroup !== false ? 'bg-emerald-500/10 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                                <IoLogoWhatsapp size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#0F172A] text-xs">WhatsApp Banner</h2>
                                <p className="text-[11px] text-stone-500 leading-snug mt-0.5">Show or hide the WhatsApp invite banner on student portal.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave({ ...settings, showWhatsAppGroup: settings.showWhatsAppGroup === false ? true : false })}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 cursor-pointer ${settings.showWhatsAppGroup !== false ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-stone-300'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.showWhatsAppGroup !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* AI Study Suite Toggle */}
                    <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${settings.showAITools !== false ? 'bg-amber-500/10 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                                <IoSparklesOutline size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#0F172A] text-xs">AI Study Suite</h2>
                                <p className="text-[11px] text-stone-500 leading-snug mt-0.5">Show or hide the AI Study Suite section for students.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave({ ...settings, showAITools: settings.showAITools === false ? true : false })}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 cursor-pointer ${settings.showAITools !== false ? 'bg-orange-500 shadow-md shadow-orange-500/20' : 'bg-stone-300'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.showAITools !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Flexible Entry Toggle */}
                    <div className="bg-white border border-[#EDE8E0] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${settings.flexibleEntry ? 'bg-violet-500/10 text-violet-600' : 'bg-stone-100 text-stone-400'}`}>
                                <IoTimerOutline size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#0F172A] text-xs">Flexible Entry</h2>
                                <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                                    {settings.flexibleEntry
                                        ? 'Students mark within 1 hr of their shift window.'
                                        : 'Students mark only between 5 AM and 10 PM.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSave({ ...settings, flexibleEntry: !settings.flexibleEntry })}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 cursor-pointer ${settings.flexibleEntry ? 'bg-violet-500 shadow-md shadow-violet-500/20' : 'bg-stone-300'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.flexibleEntry ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-4">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === t.key
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                                : 'bg-white border border-[#EDE8E0] text-stone-700 hover:bg-[#FAF6F0]'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#EDE8E0] rounded-2xl p-6 min-h-[400px] shadow-xs">

                    {activeTab === 'default' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block" />
                                        <h2 className="font-bold text-[#0F172A] text-sm">Default Logic</h2>
                                    </div>
                                    <p className="text-xs text-stone-500 max-w-md">Fixed hardcoded shifts — the fail-safe mode for standard operations.</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSave({ ...settings, shiftMode: 'default' })}
                                    disabled={settings.shiftMode === 'default'}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settings.shiftMode === 'default'
                                        ? 'bg-[#FAF6F0] border border-[#EDE8E0] text-stone-500 cursor-default'
                                        : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25'}`}>
                                    {settings.shiftMode === 'default' ? '✓ Currently Active' : 'Activate Default Mode'}
                                </motion.button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                {[
                                    { name: 'Morning', time: '09:00 – 15:00', price: '₹800', color: 'text-orange-600' },
                                    { name: 'Evening', time: '15:00 – 21:00', price: '₹800', color: 'text-amber-600' },
                                    { name: 'Full Day', time: '09:00 – 21:00', price: '₹1200', color: 'text-emerald-600' },
                                ].map(s => (
                                    <div key={s.name} className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`font-black text-sm ${s.color}`}>{s.name}</span>
                                            <span className="text-[10px] font-bold bg-white text-stone-700 px-2 py-0.5 rounded-md border border-[#EDE8E0]">{s.time}</span>
                                        </div>
                                        <p className="text-2xl font-black text-[#0F172A]">{s.price}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                                        <h2 className="font-bold text-[#0F172A] text-sm">Custom Logic</h2>
                                    </div>
                                    <p className="text-xs text-stone-500 max-w-md">Dynamic shifts — flexible timing for unlimited configurations.</p>
                                </div>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => handleSave({ ...settings, shiftMode: 'custom' })}
                                    disabled={settings.shiftMode === 'custom'}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${settings.shiftMode === 'custom'
                                        ? 'bg-[#FAF6F0] border border-[#EDE8E0] text-stone-500 cursor-default'
                                        : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25'}`}>
                                    {settings.shiftMode === 'custom' ? '✓ Currently Active' : 'Activate Custom Mode'}
                                </motion.button>
                            </div>
                            <ShiftManager />
                        </div>
                    )}
                </motion.div>

                {/* Save Button */}
                <div className="flex justify-end mt-4">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleSave()} disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/25 disabled:opacity-50 transition-all cursor-pointer">
                        <IoSave size={15} /> {saving ? 'Saving…' : 'Save Configuration'}
                    </motion.button>
                </div>

                {/* Success Toast */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                            className="fixed bottom-8 right-8 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold">
                            <IoCheckmarkCircle size={18} /> {successMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Settings;
