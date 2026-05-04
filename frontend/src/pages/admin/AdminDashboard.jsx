import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboardSkeleton } from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoSchool, IoCalendarOutline, IoCashOutline, IoBedOutline,
    IoNotificationsOutline, IoLogOut, IoScanOutline, IoTimeOutline, IoKey,
    IoPersonOutline, IoBarChartOutline, IoChatbubblesOutline,
    IoShieldCheckmarkOutline, IoDocumentTextOutline, IoArrowForward, IoPower, IoLocationOutline,
    IoGridOutline, IoSparklesOutline, IoSearchOutline, IoKeypadOutline, IoSettingsOutline, IoQrCodeOutline
} from 'react-icons/io5';
import ShiftManager from '../../components/admin/ShiftManager';
import QRScannerModal from '../../components/admin/QRScannerModal';

/* ── shared bg ─────────────────────────────────────── */
const BG_STYLE = `
@keyframes orb1{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-60px) scale(1.1);}66%{transform:translate(-30px,20px) scale(0.9);}}
@keyframes orb2{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-50px,40px) scale(1.15);}66%{transform:translate(25px,-35px) scale(0.85);}}
.admin-glass{background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.07);}
.admin-glass:hover{background:linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02));border-color:rgba(255,255,255,0.12);}
`;

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [activeTab, setActiveTab] = useState('custom');
    const [settings, setSettings] = useState({ activeModes: { default: true, custom: false } });
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinSaving, setPinSaving] = useState(false);
    const [pinMsg, setPinMsg] = useState('');
    const settingsRef = useRef(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { fetchSettings(); }, []);
    useEffect(() => { fetchDashboardStats(activeTab); }, [activeTab]);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.settings) setSettings(res.data.settings);
        } catch (e) { console.error(e); }
    };

    const handleToggleMode = async (mode) => {
        try {
            const currentModes = settings.activeModes || { default: true, custom: false };
            const newModes = { ...currentModes, [mode]: !currentModes[mode] };
            const res = await api.put('/admin/settings', { activeModes: newModes });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) { await fetchSettings(); }
    };

    const handleToggleLocation = async () => {
        try {
            const currentSetting = settings.locationAttendance !== undefined ? settings.locationAttendance : true;
            const newSetting = !currentSetting;
            const res = await api.put('/admin/settings', { locationAttendance: newSetting });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) { await fetchSettings(); }
    };

    const handleTogglePinAttendance = async () => {
        try {
            const newVal = !settings?.pinAttendanceEnabled;
            const res = await api.put('/admin/settings', { pinAttendanceEnabled: newVal });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) { await fetchSettings(); }
    };

    const handleSavePin = async () => {
        const trimmed = pinInput.trim();
        if (!trimmed || trimmed.length < 4) { setPinMsg('PIN must be at least 4 digits.'); return; }
        if (!/^\d+$/.test(trimmed)) { setPinMsg('Numbers only.'); return; }
        setPinSaving(true);
        try {
            const res = await api.put('/admin/settings', { attendancePin: trimmed });
            if (res.data.settings) setSettings(res.data.settings);
            setPinMsg(`✓ PIN set to ${trimmed}`);
            setTimeout(() => { setPinMsg(''); setPinInput(''); }, 2000);
        } catch (e) { setPinMsg('Failed to save PIN.'); }
        finally { setPinSaving(false); }
    };

    const handleToggleTimeRestriction = async () => {
        try {
            const newVal = !(settings?.timeRestrictionEnabled !== false);
            const res = await api.put('/admin/settings', { timeRestrictionEnabled: newVal });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) { await fetchSettings(); }
    };

    const handleToggleLoginAttendance = async () => {
        try {
            const newVal = !settings?.loginAttendanceEnabled;
            const res = await api.put('/admin/settings', { loginAttendanceEnabled: newVal });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) { await fetchSettings(); }
    };

    const fetchDashboardStats = async (mode = 'default') => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/dashboard?mode=${mode}`);
            setStats(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const menuItems = [
        { title: 'Student Management', path: '/admin/students', icon: IoPersonOutline, color: 'from-blue-500 to-purple-500', desc: 'Manage student records & seats' },
        { title: 'Floor & Seat Management', path: '/admin/floors', icon: IoBedOutline, color: 'from-green-500 to-teal-500', desc: 'Configure floors, rooms & seats' },
        { title: 'Attendance Management', path: '/admin/attendance', icon: IoCalendarOutline, color: 'from-orange-500 to-red-500', desc: 'Track daily attendance records' },
        { title: 'Fee Management', path: '/admin/fees', icon: IoCashOutline, color: 'from-yellow-500 to-orange-500', desc: 'Monitor and collect fees' },
        { title: 'Notifications', path: '/admin/notifications', icon: IoNotificationsOutline, color: 'from-pink-500 to-rose-500', desc: 'Send announcements to students' },
        { title: 'Student Requests', path: '/admin/requests', icon: IoDocumentTextOutline, color: 'from-indigo-500 to-blue-500', desc: 'Handle seat & shift requests' },
        { title: 'Shift Management', path: '/admin/shifts', icon: IoTimeOutline, color: 'from-cyan-500 to-blue-500', desc: 'Configure study shift timings' },
        { title: 'Action History', path: '/admin/history', icon: IoSchool, color: 'from-gray-500 to-slate-500', desc: 'Review admin action logs' },
        { title: 'Password Activity', path: '/admin/password-activity', icon: IoKey, color: 'from-red-500 to-orange-500', desc: 'Monitor auth & security events' },
        { title: 'Analytics & Reports', path: '/admin/analytics', icon: IoBarChartOutline, color: 'from-blue-500 to-cyan-500', desc: 'Revenue, trends & statistics' },
        { title: 'Discussion Management', path: '/admin/chat', icon: IoChatbubblesOutline, color: 'from-violet-500 to-fuchsia-500', desc: 'Monitor chat rooms & students' },
        { title: 'AI Chat History', path: '/admin/chat-history', icon: IoSparklesOutline, color: 'from-indigo-600 to-purple-600', desc: 'View student AI doubt sessions' },
        { title: 'Kiosk Mode', path: '/admin/kiosk', icon: IoScanOutline, color: 'from-purple-500 to-pink-500', desc: 'QR kiosk for entry scanning' },
        { title: 'Manage Cards', path: '/admin/manage-cards', icon: IoGridOutline, color: 'from-yellow-400 to-orange-500', desc: 'Dashboard cards · AI credits · Reorder' },
        { title: 'Vacant Seats', path: '/admin/vacant-seats', icon: IoSearchOutline, color: 'from-emerald-500 to-teal-500', desc: 'View all vacant seat-shift slots' },
    ];

    const STAT_CARDS = [
        { label: 'Total Students', value: stats?.totalStudents ?? '—', icon: IoPersonOutline, color: 'from-blue-500 to-purple-500', glow: 'rgba(99,102,241,0.35)' },
        { label: 'Occupied Seats', value: stats ? `${stats.occupiedSeats} / ${stats.totalSeats}` : '—', icon: IoBedOutline, color: 'from-green-500 to-teal-500', glow: 'rgba(16,185,129,0.35)' },
        { label: 'Fees Collected', value: stats ? `₹${stats.feesCollected}` : '—', icon: IoCashOutline, color: 'from-yellow-400 to-orange-500', glow: 'rgba(245,158,11,0.35)' },
        { label: 'Pending Requests', value: stats?.pendingRequests ?? '—', icon: IoNotificationsOutline, color: 'from-pink-500 to-rose-500', glow: 'rgba(236,72,153,0.35)' },
    ];

    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#050508' }}>
            <style>{BG_STYLE}</style>

            {/* Bg orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div style={{ animation: 'orb1 14s ease-in-out infinite' }} className="absolute top-[-15%] left-[-8%] w-[600px] h-[600px] rounded-full bg-purple-600/8 blur-3xl" />
                <div style={{ animation: 'orb2 18s ease-in-out infinite' }} className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-3xl" />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
            </div>

            {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg shadow-purple-500/30">
                                <IoShieldCheckmarkOutline size={20} className="text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Admin Panel</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white">Admin Dashboard</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Apna Lakshay Management System</p>
                    </div>
                    <div className="flex items-center gap-3">

                        {/* ── Unified Settings Dropdown ── */}
                        <div className="relative" ref={settingsRef}>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => { setShowSettingsDropdown(p => !p); setPinMsg(''); }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                            >
                                <IoSettingsOutline size={18} className={showSettingsDropdown ? 'rotate-45 transition-transform duration-300' : 'transition-transform duration-300'} />
                                Settings
                                {/* active dot if any toggle is on */}
                                {(settings?.pinAttendanceEnabled || settings?.activeModes?.custom || settings?.locationAttendance === false) && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {showSettingsDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setShowSettingsDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.92, y: -8 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.92, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl shadow-2xl overflow-hidden"
                                            style={{ background: 'rgba(10,10,16,0.98)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
                                        >
                                            {/* Header */}
                                            <div className="px-4 py-3 border-b border-white/5">
                                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">System Controls</p>
                                            </div>

                                            <div className="p-3 space-y-1">

                                                {/* Row 1 — System Status */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${settings?.activeModes?.custom ? 'bg-red-500/15' : 'bg-green-500/15'}`}>
                                                            <IoPower size={15} className={settings?.activeModes?.custom ? 'text-red-400' : 'text-green-400'} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">System Status</p>
                                                            <p className="text-xs text-gray-600">{settings?.activeModes?.custom ? 'Maintenance mode ON' : 'System is active'}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleToggleMode.bind(null, 'custom')}
                                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings?.activeModes?.custom ? 'bg-red-500' : 'bg-green-500'}`}>
                                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings?.activeModes?.custom ? 'translate-x-5' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Row 2 — Location */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${settings?.locationAttendance !== false ? 'bg-blue-500/15' : 'bg-gray-500/15'}`}>
                                                            <IoLocationOutline size={15} className={settings?.locationAttendance !== false ? 'text-blue-400' : 'text-gray-500'} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">Location Check</p>
                                                            <p className="text-xs text-gray-600">{settings?.locationAttendance !== false ? 'Required for attendance' : 'Disabled (anyone can mark)'}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleToggleLocation}
                                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings?.locationAttendance !== false ? 'bg-blue-500' : 'bg-white/10'}`}>
                                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings?.locationAttendance !== false ? 'translate-x-5' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Row 3 — PIN Attendance */}
                                                <div className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1.5 rounded-lg ${settings?.pinAttendanceEnabled ? 'bg-amber-500/15' : 'bg-gray-500/15'}`}>
                                                                <IoKeypadOutline size={15} className={settings?.pinAttendanceEnabled ? 'text-amber-400' : 'text-gray-500'} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-white">PIN Attendance</p>
                                                                <p className="text-xs text-gray-600">{settings?.pinAttendanceEnabled ? `Active · PIN: ${settings?.attendancePin || 'not set'}` : 'Off (camera required)'}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={handleTogglePinAttendance}
                                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings?.pinAttendanceEnabled ? 'bg-amber-500' : 'bg-white/10'}`}>
                                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings?.pinAttendanceEnabled ? 'translate-x-5' : ''}`} />
                                                        </button>
                                                    </div>
                                                    {/* PIN input — always visible when PIN mode is on */}
                                                    {settings?.pinAttendanceEnabled && (
                                                        <div className="mt-2.5 flex gap-2">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                value={pinInput}
                                                                onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                                                onKeyDown={e => e.key === 'Enter' && handleSavePin()}
                                                                placeholder="New PIN (4–8 digits)"
                                                                className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-amber-500/50 placeholder-gray-600"
                                                            />
                                                            <button onClick={handleSavePin} disabled={pinSaving}
                                                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors disabled:opacity-50">
                                                                {pinSaving ? '…' : 'Set'}
                                                            </button>
                                                        </div>
                                                    )}
                                                     {pinMsg && <p className={`text-xs mt-1.5 ${pinMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{pinMsg}</p>}
                                                </div>

                                                {/* Row 4 — Time Restriction */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${settings?.timeRestrictionEnabled !== false ? 'bg-purple-500/15' : 'bg-gray-500/15'}`}>
                                                            <IoTimeOutline size={15} className={settings?.timeRestrictionEnabled !== false ? 'text-purple-400' : 'text-gray-500'} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">Time Restriction</p>
                                                            <p className="text-xs text-gray-600">{settings?.timeRestrictionEnabled !== false ? 'Shift hours only' : 'Anytime (no limit)'}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleToggleTimeRestriction}
                                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings?.timeRestrictionEnabled !== false ? 'bg-purple-500' : 'bg-white/10'}`}>
                                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings?.timeRestrictionEnabled !== false ? 'translate-x-5' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Row 5 — Login Attendance Button */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${settings?.loginAttendanceEnabled ? 'bg-green-500/15' : 'bg-gray-500/15'}`}>
                                                            <IoQrCodeOutline size={15} className={settings?.loginAttendanceEnabled ? 'text-green-400' : 'text-gray-500'} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">Login Attendance</p>
                                                            <p className="text-xs text-gray-600">{settings?.loginAttendanceEnabled ? 'Button visible on login' : 'Hidden on login screen'}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleToggleLoginAttendance}
                                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings?.loginAttendanceEnabled ? 'bg-green-500' : 'bg-white/10'}`}>
                                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings?.loginAttendanceEnabled ? 'translate-x-5' : ''}`} />
                                                    </button>
                                                </div>

                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all">
                            <IoScanOutline size={18} /> Scan ID
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-semibold text-sm transition-all">
                            <IoLogOut size={18} /> Logout
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                {loading ? <AdminDashboardSkeleton /> : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {STAT_CARDS.map(({ label, value, icon: Icon, color, glow }, i) => (
                            <motion.div key={label}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="admin-glass relative rounded-2xl p-5 overflow-hidden group"
                                style={{ boxShadow: `0 0 0 0 ${glow}` }}
                            >
                                <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                                <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500`} />
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} w-fit shadow-lg mb-3`} style={{ boxShadow: `0 6px 20px -4px ${glow}` }}>
                                    <Icon size={18} className="text-white" />
                                </div>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{label}</p>
                                <p className={`text-3xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent`}>{value}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Shift Manager */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
                    <ShiftManager allowDelete={false} />
                </motion.div>

                {/* Navigation Grid */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <div className="flex items-center gap-3 mb-5">
                        <h2 className="text-lg font-bold text-white">Management</h2>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {menuItems.map((item, i) => (
                            <Link key={item.path} to={item.path}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.38 + i * 0.05, type: 'spring', stiffness: 90 }}
                                    whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    className="admin-glass relative rounded-2xl p-5 cursor-pointer group overflow-hidden transition-all duration-300 flex items-center gap-4"
                                    style={item.isNew ? { border: '1px solid rgba(250,204,21,0.25)', boxShadow: '0 0 20px rgba(250,204,21,0.08)' } : {}}
                                >
                                    <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    <div className={`shrink-0 p-3.5 rounded-xl bg-gradient-to-br ${item.color} shadow-lg transition-transform group-hover:scale-110 duration-300`}>
                                        <item.icon size={22} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-white text-sm leading-snug">{item.title}</p>
                                            {item.isNew && (
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
                                                    style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', color: '#FACC15' }}>NEW</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors mt-0.5">{item.desc}</p>
                                    </div>
                                    <IoArrowForward className="shrink-0 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" size={18} />
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
