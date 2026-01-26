import { IoLockClosed } from 'react-icons/io5';
import { motion } from 'framer-motion';

const AchievementBadge = ({ achievement, locked = false }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className={`relative p-4 rounded-xl border flex flex-col items-center justify-center text-center w-full aspect-square ${locked
                ? 'bg-gray-900/60 border-gray-800 text-gray-400'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                }`}
        >
            <div className={`p-4 rounded-full mb-3 ${locked ? 'bg-gray-700' : 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-inner'}`}>
                {locked ? (
                    <IoLockClosed className="text-gray-400 text-2xl" />
                ) : (
                    <div className="text-2xl text-white drop-shadow-md">
                        {achievement.icon}
                    </div>
                )}
            </div>

            <h4 className={`font-bold text-sm ${locked ? 'text-gray-500' : 'text-gray-200'}`}>
                {achievement.title}
            </h4>

            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {achievement.description}
            </p>

            {/* Progress Bar */}
            {locked && achievement.total > 0 && (
                <div className="w-full mt-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono">
                        <span>Progress</span>
                        <span className="text-blue-400 font-bold">{achievement.progress} / {achievement.total}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((achievement.progress / achievement.total) * 100, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.4)] rounded-full relative"
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30" />
                        </motion.div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AchievementBadge;
