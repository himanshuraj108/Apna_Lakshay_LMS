import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DoubtBoard from '../pages/student/DoubtBoard';

// Forced overlay: covers entire screen when admin enables 'Force AI Doubt Board'
// Student can close it with the red X button (saved per session)
// Attendance FAB still shows above this overlay (FAB has z-[99999])
const ForcedDoubtOverlay = ({ onClose }) => {
    // Prevent body scroll while open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 800,
                    background: '#ffffff',
                }}
            >
                <DoubtBoard forceMode={true} onClose={onClose} />
            </motion.div>
        </AnimatePresence>
    );
};

export default ForcedDoubtOverlay;