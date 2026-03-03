import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoTimeOutline, IoArrowBack, IoSunny, IoMoon, IoDesktopOutline } from 'react-icons/io5';
import { useTheme } from '../../context/ThemeContext';

const AccessDeniedPending = () => {
    const { theme, toggleTheme, setTheme } = useTheme();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 relative transition-colors duration-300">
            {/* Theme Toggle - Segmented Control */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
                <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-full border border-gray-300 dark:border-gray-700 shadow-sm scale-90 sm:scale-100 origin-top-right">
                    <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`p-2 rounded-full transition-all ${theme === 'system'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        title="System Theme"
                    >
                        <IoDesktopOutline size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`p-2 rounded-full transition-all ${theme === 'light'
                            ? 'bg-yellow-500 text-white shadow-lg'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        title="Light Mode"
                    >
                        <IoSunny size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`p-2 rounded-full transition-all ${theme === 'dark'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        title="Dark Mode"
                    >
                        <IoMoon size={18} />
                    </button>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-[24px] shadow-2xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 mx-auto"
            >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
                    <IoTimeOutline className="text-yellow-600 dark:text-yellow-500 text-4xl" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Allocation Pending</h1>
                <p className="text-orange-500 font-bold mb-6 uppercase tracking-[0.15em] text-xs sm:text-sm">
                    Seat Assignment Required
                </p>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-8 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border border-gray-100 dark:border-transparent">
                    <p>
                        Your account is active, but you have not been assigned a seat yet.
                        Premium features like Chat, Study Planner, and Stats are locked until an admin allocates a seat to you.
                    </p>
                </div>

                <div className="space-y-3 mt-8">
                    <Link
                        to="/student/profile"
                        className="block w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-bold transition-all shadow-[0_8px_20px_-6px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(249,115,22,0.6)] hover:-translate-y-0.5"
                    >
                        Check Status
                    </Link>
                    <Link
                        to="/student"
                        className="block w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessDeniedPending;
