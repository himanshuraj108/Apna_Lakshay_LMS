import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../utils/api';
import { IoSettings, IoPower, IoTime, IoSave } from 'react-icons/io5';
import ShiftManager from '../../components/admin/ShiftManager';

const Settings = () => {
    const [settings, setSettings] = useState({
        shiftMode: 'default',
        systemStatus: 'active'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('default');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            if (response.data.success) {
                setSettings(response.data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (newSettings = settings) => {
        setSaving(true);
        try {
            const response = await api.put('/settings', newSettings);
            if (response.data.success) {
                setSettings(response.data.settings);
                setSuccessMessage('Settings updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-white">Loading settings...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-8">
                <IoSettings /> System Configuration
            </h1>

            {/* Global Status Control */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10 flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${settings.systemStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <IoPower size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">System Status</h3>
                        <p className="text-sm text-gray-400">
                            {settings.systemStatus === 'active' ? 'System is Online' : 'System is in Maintenance Mode'}
                        </p>
                    </div>
                </div>
                <div className="flex bg-gray-900 rounded-lg p-1">
                    <button
                        onClick={() => handleSave({ ...settings, systemStatus: 'active' })}
                        className={`px-4 py-2 rounded-md transition-all ${settings.systemStatus === 'active' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => handleSave({ ...settings, systemStatus: 'maintenance' })}
                        className={`px-4 py-2 rounded-md transition-all ${settings.systemStatus === 'maintenance' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Maintenance
                    </button>
                </div>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('default')}
                    className={`px-8 py-4 font-semibold text-lg rounded-t-xl border-t border-l border-r -mb-[1px] transition-all whitespace-nowrap ${activeTab === 'default'
                            ? 'bg-[#1e1e1e] border-white/10 text-blue-400 z-10'
                            : 'bg-white/5 border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Default Configuration
                </button>
                <button
                    onClick={() => setActiveTab('custom')}
                    className={`px-8 py-4 font-semibold text-lg rounded-t-xl border-t border-l border-r -mb-[1px] transition-all whitespace-nowrap ${activeTab === 'custom'
                            ? 'bg-[#1e1e1e] border-white/10 text-green-400 z-10'
                            : 'bg-white/5 border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Custom Configuration
                </button>
            </div>

            {/* Tab Content Box */}
            <div className="bg-[#1e1e1e] border border-white/10 rounded-b-xl rounded-tr-xl p-6 min-h-[400px] relative z-0">
                {activeTab === 'default' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    Default Logic
                                </h2>
                                <p className="text-gray-400 max-w-xl">
                                    The system uses fixed hardcoded shifts. This is the fail-safe mode suitable for standard operations.
                                </p>
                            </div>
                            <Button
                                onClick={() => handleSave({ ...settings, shiftMode: 'default' })}
                                disabled={settings.shiftMode === 'default'}
                                variant={settings.shiftMode === 'default' ? 'secondary' : 'primary'}
                                className="px-6"
                            >
                                {settings.shiftMode === 'default' ? 'Currently Active' : 'Activate Default Mode'}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between mb-2">
                                    <span className="text-blue-400 font-bold">Morning</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded">09:00 - 15:00</span>
                                </div>
                                <p className="text-2xl font-bold">₹800</p>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between mb-2">
                                    <span className="text-purple-400 font-bold">Evening</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded">15:00 - 21:00</span>
                                </div>
                                <p className="text-2xl font-bold">₹800</p>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between mb-2">
                                    <span className="text-green-400 font-bold">Full Day</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded">09:00 - 21:00</span>
                                </div>
                                <p className="text-2xl font-bold">₹1200</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    Custom Logic
                                </h2>
                                <p className="text-gray-400 max-w-xl">
                                    The system uses dynamic shifts created in Shift Management. This allows for unlimited flexible timing configurations.
                                </p>
                            </div>
                            <Button
                                onClick={() => handleSave({ ...settings, shiftMode: 'custom' })}
                                disabled={settings.shiftMode === 'custom'}
                                variant={settings.shiftMode === 'custom' ? 'secondary' : 'primary'}
                                className="px-6 bg-green-600 hover:bg-green-500"
                            >
                                {settings.shiftMode === 'custom' ? 'Currently Active' : 'Activate Custom Mode'}
                            </Button>
                        </div>

                        <div className="mt-8">
                            <ShiftManager />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 text-lg"
                >
                    <IoSave />
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

            {successMessage && (
                <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce">
                    {successMessage}
                </div>
            )}
        </div>
    );
};

export default Settings;
