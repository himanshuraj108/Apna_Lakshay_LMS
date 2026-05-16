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
    { key: 'attendance',    label: 'Attendance Management',  desc: 'Mark & view daily attendance' },
    { key: 'students',      label: 'View Students',          desc: 'View student list & details' },
    { key: 'fees',          label: 'Fee Status',             desc: 'View fee records (read-only)' },
    { key: 'notifications', label: 'Send Notifications',     desc: 'Send announcements to students' },
    { key: 'requests',      label: 'Student Requests',       desc: 'View & handle seat/shift requests' },
    { key: 'vacant_seats',  label: 'Vacant Seats',           desc: 'View available seat-shift slots' },
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
        <div className="min-h-screen bg-gray-50">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-xl border ${
                            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        {toast.type === 'success' ? <IoCheckmarkCircle size={16} /> : <IoCloseCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
                    <Link to="/admin" className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl">
                        <IoShieldCheckmarkOutline size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-gray-900 font-black text-lg">Sub Admin Management</h1>
                        <p className="text-gray-500 text-xs">Create and manage restricted admin accounts</p>
                    </div>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all">
                        <IoAddOutline size={16} /> New Sub-Admin
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-700">
                    <strong>What is a Sub-Admin?</strong> Sub-admins have limited access to the admin panel.
                    They can only use features you explicitly grant them. They cannot reset passwords, manage seats,
                    view finances in full, or access system settings.
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : subAdmins.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                        <IoShieldCheckmarkOutline size={40} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No sub-admins yet</p>
                        <p className="text-gray-400 text-sm mt-1">Click "New Sub-Admin" to create one</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subAdmins.map(sub => (
                            <motion.div key={sub._id} layout
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`bg-white border rounded-2xl p-5 shadow-sm flex items-start gap-4 ${sub.isActive ? 'border-gray-200' : 'border-red-100 opacity-60'}`}>

                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 ${sub.isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-400'}`}>
                                    {sub.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-black text-gray-900">{sub.name}</p>
                                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">@{sub.username}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {sub.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    {/* Permissions */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {sub.permissions.length === 0 ? (
                                            <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                                        ) : sub.permissions.map(p => {
                                            const perm = ALL_PERMISSIONS.find(x => x.key === p);
                                            return (
                                                <span key={p} className="text-[11px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                                                    {perm?.label || p}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        Created {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => toggleActive(sub)}
                                        title={sub.isActive ? 'Deactivate' : 'Activate'}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${sub.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                        {sub.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => openEdit(sub)}
                                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                        <IoPencilOutline size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(sub._id, sub.name)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                        <IoTrashOutline size={16} />
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                        <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
                            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-100 rounded-lg"><IoShieldCheckmarkOutline size={16} className="text-indigo-600" /></div>
                                    <h2 className="font-black text-gray-900">{editTarget ? 'Edit Sub-Admin' : 'Create Sub-Admin'}</h2>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                                    <IoClose size={18} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Rahul Sharma"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 transition-all" />
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Username (for login)</label>
                                    <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                        placeholder="e.g. rahul_admin"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 transition-all font-mono" />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                        Password {editTarget && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
                                    </label>
                                    <div className="relative">
                                        <input type={showPwd ? 'text' : 'password'} value={form.password}
                                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                            placeholder="Min. 6 characters"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 transition-all pr-10" />
                                        <button type="button" onClick={() => setShowPwd(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                                            {showPwd ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* PIN */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                                        Access PIN (4 Digits) {editTarget && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
                                    </label>
                                    <input type="text" inputMode="numeric" pattern="\d*" maxLength="4" value={form.pin}
                                        onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                        placeholder="e.g. 1234"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 transition-all font-mono" />
                                </div>

                                {/* Permissions */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                        Allowed Permissions <span className="text-gray-400 font-normal normal-case">(select what this sub-admin can access)</span>
                                    </label>
                                    <div className="space-y-2">
                                        {ALL_PERMISSIONS.map(perm => {
                                            const checked = form.permissions.includes(perm.key);
                                            return (
                                                <button key={perm.key} type="button" onClick={() => togglePerm(perm.key)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                                        checked ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                    }`}>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                                                    }`}>
                                                        {checked && <IoCheckmarkCircle size={14} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${checked ? 'text-indigo-700' : 'text-gray-700'}`}>{perm.label}</p>
                                                        <p className="text-[11px] text-gray-400">{perm.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active status (only in edit mode) */}
                                {editTarget && (
                                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">Account Status</p>
                                            <p className="text-xs text-gray-400">Inactive accounts cannot log in</p>
                                        </div>
                                        <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                                            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                                <button onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-indigo-500/25">
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
