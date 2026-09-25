import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoPersonAddOutline, IoTrashOutline, IoPencilOutline,
    IoCheckmarkCircle, IoCloseCircle, IoEyeOutline, IoEyeOffOutline,
    IoShieldCheckmarkOutline, IoAddOutline, IoSave, IoClose
} from 'react-icons/io5';
import api from '../../utils/api';

const ALL_PERMISSIONS = [
    { key: 'attendance',     label: 'Attendance Management',  desc: 'Mark & view daily attendance' },
    { key: 'students',       label: 'View Students',          desc: 'View student list & details' },
    { key: 'id_cards',       label: 'Student ID Cards',       desc: 'View and print student ID cards' },
    { key: 'fees',           label: 'Fee Management',         desc: 'View fee records & collect dues' },
    { key: 'notifications',  label: 'Send Notifications',     desc: 'Send announcements to students' },
    { key: 'requests',       label: 'Student Requests',       desc: 'View & handle seat/shift requests' },
    { key: 'vacant_seats',   label: 'Vacant Seats',           desc: 'View available seat-shift slots' },
    { key: 'floors',         label: 'Floor & Seat Matrix',    desc: 'View floor layout and seat management' },
    { key: 'shifts',         label: 'Shift Operations',       desc: 'View & manage shift timings' },
    { key: 'kiosk',          label: 'QR Entry Kiosk',         desc: 'Access full-screen QR attendance kiosk' },
    { key: 'chat',           label: 'Discussion Rooms',       desc: 'Moderate student study chat rooms' },
    { key: 'chat_history',   label: 'Student Chat History',   desc: 'Audit AI doubt queries & chat logs' },
    { key: 'analytics',      label: 'Reports & Analytics',    desc: 'View revenue charts & growth reports' },
    { key: 'activities',     label: 'Student Activities & XP',desc: 'View gamification leaderboard & XP' },
    { key: 'ai_activity',    label: 'AI Study Logs',          desc: 'Monitor AI quiz & study planner usage' },
    { key: 'referral_wallet',label: 'Referral & Wallet',      desc: 'Manage referral payouts & coin ledger' },
];

const EMPTY_FORM = { name: '', username: '', password: '', pin: '', permissions: [], isActive: true };

const SubAdminManagement = () => {
    const [subAdmins, setSubAdmins]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [showForm, setShowForm]     = useState(false);
    const [editTarget, setEditTarget] = useState(null); // null = create, id = edit
    const [form, setForm]             = useState(EMPTY_FORM);
    const [showPwd, setShowPwd]       = useState(false);
    const [saving, setSaving]         = useState(false);
    const [toast, setToast]           = useState(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/sub-admins');
            setSubAdmins(res.data.subAdmins);
        } catch (e) { showMsg('Failed to load sub-admins', 'error'); }
        finally { setLoading(false); }
    };

    const showMsg = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditTarget(null);
        setShowForm(true);
    };

    const openEdit = (sub) => {
        setForm({ name: sub.name, username: sub.username, password: '', pin: sub.pin || '', permissions: sub.permissions, isActive: sub.isActive });
        setEditTarget(sub._id);
        setShowForm(true);
    };

    const togglePerm = (key) => {
        setForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter(p => p !== key)
                : [...prev.permissions, key]
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.username.trim()) return showMsg('Name and username required', 'error');
        if (!editTarget && !form.password) return showMsg('Password required for new sub-admin', 'error');
        if (form.password && form.password.length < 6) return showMsg('Password must be at least 6 characters', 'error');

        setSaving(true);
        try {
            if (editTarget) {
                await api.put(`/admin/sub-admins/${editTarget}`, form);
                showMsg('Sub-admin updated successfully');
            } else {
                await api.post('/admin/sub-admins', form);
                showMsg('Sub-admin created successfully');
            }
            setShowForm(false);
            fetchAll();
        } catch (e) {
            showMsg(e.response?.data?.message || 'Operation failed', 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete sub-admin "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/sub-admins/${id}`);
            showMsg(`${name} deleted`);
            setSubAdmins(prev => prev.filter(s => s._id !== id));
        } catch (e) { showMsg('Delete failed', 'error'); }
    };

    const toggleActive = async (sub) => {
        try {
            await api.put(`/admin/sub-admins/${sub._id}`, { isActive: !sub.isActive });
            setSubAdmins(prev => prev.map(s => s._id === sub._id ? { ...s, isActive: !s.isActive } : s));
            showMsg(`${sub.name} ${!sub.isActive ? 'activated' : 'deactivated'}`);
        } catch (e) { showMsg('Failed to update status', 'error'); }
    };

    return (
        <div className="min-h-screen relative" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold shadow-xl border ${
                            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                        {toast.type === 'success' ? <IoCheckmarkCircle size={16} /> : <IoCloseCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-[#EDE8E0] shadow-2xs">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
                    <Link to="/admin" className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-[#FAF6F0] border border-transparent hover:border-[#EDE8E0] transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                        <IoShieldCheckmarkOutline size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-stone-900 font-bold text-base">Sub Admin Management</h1>
                        <p className="text-stone-400 text-xs font-medium">Create and manage restricted delegated admin accounts</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer">
                        <IoAddOutline size={16} /> New Sub-Admin
                    </button>
                </div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-24">

                {/* Info banner */}
                <div className="bg-white border border-[#EDE8E0] rounded-2xl p-4 mb-6 text-xs text-stone-600 shadow-2xs leading-relaxed flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                        <IoShieldCheckmarkOutline size={16} />
                    </div>
                    <div>
                        <strong className="text-stone-800 font-bold">What is a Sub-Admin?</strong> Sub-admins have limited access to the admin panel.
                        They can only use features you explicitly grant them. They cannot reset passwords, manage seats,
                        view finances in full, or access system settings.
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                ) : subAdmins.length === 0 ? (
                    <div className="bg-white border border-[#EDE8E0] rounded-2xl p-16 text-center shadow-xs">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-500">
                            <IoShieldCheckmarkOutline size={28} />
                        </div>
                        <p className="text-stone-800 font-bold text-sm">No sub-admins configured yet</p>
                        <p className="text-stone-400 text-xs mt-1">Click "New Sub-Admin" above to delegate restricted access</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subAdmins.map(sub => (
                            <motion.div key={sub._id} layout
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`bg-white border rounded-2xl p-5 shadow-xs flex items-start gap-4 transition-all ${sub.isActive ? 'border-[#EDE8E0] hover:border-orange-200' : 'border-stone-200 bg-stone-50/60 opacity-60'}`}>

                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-xs ${sub.isActive ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-stone-400'}`}>
                                    {sub.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-stone-900 text-sm">{sub.name}</p>
                                        <span className="text-xs font-mono bg-[#FAF6F0] border border-[#EDE8E0] text-stone-600 px-2 py-0.5 rounded-md">@{sub.username}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                            {sub.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    {/* Permissions */}
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {sub.permissions.length === 0 ? (
                                            <span className="text-xs text-stone-400 italic">No permissions assigned</span>
                                        ) : sub.permissions.map(p => {
                                            const perm = ALL_PERMISSIONS.find(x => x.key === p);
                                            return (
                                                <span key={p} className="text-[11px] font-bold bg-orange-50 border border-orange-200/60 text-orange-700 px-2.5 py-0.5 rounded-md">
                                                    {perm?.label || p}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-stone-400 font-medium mt-2">
                                        Created {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button onClick={() => toggleActive(sub)}
                                        title={sub.isActive ? 'Deactivate' : 'Activate'}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${sub.isActive ? 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100' : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}>
                                        {sub.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => openEdit(sub)}
                                        className="p-2 text-stone-500 hover:text-orange-600 hover:bg-orange-50 border border-[#EDE8E0] rounded-xl transition-all cursor-pointer"
                                        title="Edit Sub-Admin">
                                        <IoPencilOutline size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(sub._id, sub.name)}
                                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition-all cursor-pointer"
                                        title="Delete Sub-Admin">
                                        <IoTrashOutline size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                        <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#EDE8E0]">

                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#EDE8E0] bg-[#FAF6F0]">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                        <IoShieldCheckmarkOutline size={16} />
                                    </div>
                                    <h2 className="font-bold text-stone-900 text-base">{editTarget ? 'Edit Sub-Admin' : 'Create Sub-Admin'}</h2>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-700 transition-all cursor-pointer">
                                    <IoClose size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Rahul Sharma"
                                        className="w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all shadow-2xs font-medium" />
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Username (for login)</label>
                                    <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                        placeholder="e.g. rahul_admin"
                                        className="w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all font-mono shadow-2xs" />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                                        Password {editTarget && <span className="font-normal text-stone-400">(leave blank to keep current)</span>}
                                    </label>
                                    <div className="relative">
                                        <input type={showPwd ? 'text' : 'password'} value={form.password}
                                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                            placeholder="Min. 6 characters"
                                            className="w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all pr-10 shadow-2xs font-medium" />
                                        <button type="button" onClick={() => setShowPwd(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer">
                                            {showPwd ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* PIN */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                                        Access PIN (4 Digits) {editTarget && <span className="font-normal text-stone-400">(leave blank to keep current)</span>}
                                    </label>
                                    <input type="text" inputMode="numeric" pattern="\d*" maxLength="4" value={form.pin}
                                        onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                        placeholder="e.g. 1234"
                                        className="w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all font-mono shadow-2xs" />
                                </div>

                                {/* Permissions */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                                        Allowed Permissions <span className="text-stone-400 font-normal normal-case">(select features this sub-admin can access)</span>
                                    </label>
                                    <div className="space-y-2">
                                        {ALL_PERMISSIONS.map(perm => {
                                            const checked = form.permissions.includes(perm.key);
                                            return (
                                                <button key={perm.key} type="button" onClick={() => togglePerm(perm.key)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                                        checked ? 'bg-orange-50/80 border-orange-300 shadow-2xs' : 'bg-white border-[#EDE8E0] hover:border-orange-200 hover:bg-[#FAF6F0]'
                                                    }`}>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        checked ? 'bg-orange-500 border-orange-500' : 'border-stone-300'
                                                    }`}>
                                                        {checked && <IoCheckmarkCircle size={14} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold ${checked ? 'text-orange-700' : 'text-stone-800'}`}>{perm.label}</p>
                                                        <p className="text-[10px] text-stone-400 font-medium">{perm.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active status (only in edit mode) */}
                                {editTarget && (
                                    <div className="flex items-center justify-between bg-[#FAF6F0] border border-[#EDE8E0] rounded-2xl px-4 py-3">
                                        <div>
                                            <p className="text-xs font-bold text-stone-800">Account Status</p>
                                            <p className="text-[10px] text-stone-400 font-medium">Inactive accounts cannot log in</p>
                                        </div>
                                        <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                                            className={`relative inline-flex h-6 w-11 rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-stone-300'}`}>
                                            <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="flex items-center gap-3 px-6 py-4 border-t border-[#EDE8E0] bg-[#FAF6F0]">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 text-xs font-bold text-stone-700 bg-white border border-[#EDE8E0] rounded-xl hover:bg-[#FAF6F0] shadow-2xs transition-all cursor-pointer">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer">
                                    <IoSave size={15} /> {saving ? 'Saving…' : editTarget ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubAdminManagement;
