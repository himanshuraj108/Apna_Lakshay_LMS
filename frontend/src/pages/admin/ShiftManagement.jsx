import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useShifts from '../../hooks/useShifts';
import Button from '../../components/ui/Button';
import ShiftManager from '../../components/admin/ShiftManager';
import { IoArrowBack, IoAdd, IoAlertCircle } from 'react-icons/io5';

const ShiftManagement = () => {
    const { isCustom } = useShifts();
    // Removed unused states as logic is now in ShiftManager



    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/admin">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Shift Management
                        </h1>
                        <p className="text-gray-400 mt-2">Create custom shifts or use system defaults</p>
                    </div>

                </div>

                {!isCustom && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-8 flex items-start gap-4"
                    >
                        <IoAlertCircle className="text-blue-400 shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-blue-400 mb-1">System Default Mode</h3>
                            <p className="text-sm text-blue-200">
                                You are currently using the default configuration (Morning / Evening).
                                <strong> Creating your first custom shift will disable these defaults</strong> and only show your created shifts across the entire system.
                            </p>
                        </div>
                    </motion.div>
                )}

                <ShiftManager />
            </div>
        </div>
    );
};

export default ShiftManagement;
