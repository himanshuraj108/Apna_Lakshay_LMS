import { useMemo } from 'react';
import Card from './ui/Card';
import { IoFlame, IoTime, IoTrophy, IoCheckmarkDone } from 'react-icons/io5';

const StudyAnalytics = ({ stats }) => {
    if (!stats) return null;

    // Generate days for Current Year (Jan 1 - Dec 31)
    const days = useMemo(() => {
        // Create a map for quick access to activity counts by date string
        const activityMap = new Map();
        if (stats.activityLog) {
            stats.activityLog.forEach(log => {
                const dateKey = new Date(log.date).toDateString();
                activityMap.set(dateKey, log.count);
            });
        }

        const d = [];
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1); // Jan 1st
        const endDate = new Date(currentYear, 11, 31); // Dec 31st

        for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
            const date = new Date(dt);
            const count = activityMap.get(date.toDateString()) || 0;

            // Map count to intensity (0-4)
            let intensity = 0;
            if (count > 0) intensity = 1;
            if (count > 3) intensity = 2;
            if (count > 6) intensity = 3;
            if (count > 10) intensity = 4;

            d.push({ date, intensity, count });
        }
        return d;
    }, [stats]);

    const formatTime = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
                            <IoFlame size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Current Streak</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.currentStreak} Days</p>
                    <p className="text-xs text-gray-500 mt-1">Best: {stats.longestStreak} Days</p>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                            <IoTime size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Focus Time</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{formatTime(stats.totalFocusTime)}</p>
                    <p className="text-xs text-gray-500 mt-1">Total accumulated</p>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                            <IoTrophy size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Total XP</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalXP.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Level {stats.level}</p>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                            <IoCheckmarkDone size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Tasks Done</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.tasksCompleted}</p>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                </Card>
            </div>

            {/* Contribution Heatmap */}
            <Card className="overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <IoFlame className="text-orange-500" />
                    Study Activity
                </h3>
                <div className="overflow-x-auto pb-2">
                    <div className="flex gap-1 min-w-max">
                        {/* Render weeks columns */}
                        {Array.from({ length: 53 }).map((_, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {days.slice(weekIndex * 7, (weekIndex * 7) + 7).map((day, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        title={`${day.date.toDateString()}: ${day.count} tasks completed`}
                                        className={`w-3 h-3 rounded-sm ${day.intensity === 0 ? 'bg-gray-100' :
                                            day.intensity === 1 ? 'bg-green-900' :
                                                day.intensity === 2 ? 'bg-green-700' :
                                                    day.intensity === 3 ? 'bg-green-500' :
                                                        'bg-green-400 shadow-[0_0_5px_theme(colors.green.400)]'
                                            }`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-900"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-700"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                    </div>
                    <span>More</span>
                </div>
            </Card>
        </div>
    );
};

export default StudyAnalytics;
