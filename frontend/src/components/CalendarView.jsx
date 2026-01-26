import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChevronBack, IoChevronForward, IoCalendarOutline } from 'react-icons/io5';
import Card from './ui/Card';

const CalendarView = ({ tasks, exams = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    const getExamsForDay = (day) => {
        return exams.filter(exam => {
            if (!exam.date) return false;
            // Parse string directly to match visual date, ignoring timezone
            const dateStr = typeof exam.date === 'string' ? exam.date.split('T')[0] : new Date(exam.date).toISOString().split('T')[0];
            const [y, m, d] = dateStr.split('-').map(Number);

            return (
                d === day &&
                m === currentDate.getMonth() + 1 &&
                y === currentDate.getFullYear()
            );
        });
    };

    const getTasksForDay = (day) => {
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            // Parse string directly to match visual date, ignoring timezone
            const dateStr = typeof task.dueDate === 'string' ? task.dueDate.split('T')[0] : new Date(task.dueDate).toISOString().split('T')[0];
            const [y, m, d] = dateStr.split('-').map(Number);

            return (
                d === day &&
                m === currentDate.getMonth() + 1 &&
                y === currentDate.getFullYear()
            );
        });
    };

    const handleDateClick = (day) => {
        setSelectedDate(day === selectedDate ? null : day);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <IoCalendarOutline />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex bg-gray-800 rounded-lg p-1 border border-white/10">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors">
                        <IoChevronBack size={18} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-colors">
                        <IoChevronForward size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {[...Array(firstDay).keys()].map(i => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {[...Array(days).keys()].map(i => {
                    const day = i + 1;
                    const dayTasks = getTasksForDay(day);
                    const dayExams = getExamsForDay(day);
                    const isSelected = selectedDate === day;
                    const hasEvents = dayTasks.length > 0 || dayExams.length > 0;

                    return (
                        <motion.div
                            key={day}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDateClick(day)}
                            className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${isSelected
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                : dayExams.length > 0
                                    ? 'text-white shadow-md'
                                    : hasEvents
                                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50 text-white'
                                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                                }`}
                            style={!isSelected && dayExams.length > 0 ? {
                                backgroundColor: dayExams[0].color + '40', // 25% opacity
                                borderColor: dayExams[0].color
                            } : {}}
                        >
                            <span className={`text-sm font-bold ${isSelected ? 'scale-110' : ''}`}>{day}</span>

                            {/* Indicators */}
                            {(dayExams.length > 0 || dayTasks.length > 0) && (
                                <div className="mt-1 flex gap-1 flex-wrap justify-center px-1">
                                    {/* Task Dots (Only show tasks, exams are background) */}
                                    {dayTasks.slice(0, 4).map((t, idx) => (
                                        <div
                                            key={`task-${idx}`}
                                            className={`w-1.5 h-1.5 rounded-[1px] ${t.completed ? 'bg-green-400/80' : t.priority === 'high' ? 'bg-purple-500' : 'bg-gray-400'}`}
                                            title={t.title}
                                        />
                                    ))}
                                    {dayTasks.length > 4 && (
                                        <span className="w-1 h-1 rounded-full bg-gray-500 self-center" />
                                    )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="bg-gray-800/50 border-gray-700">
                            <h3 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-3">
                                Schedule for {monthNames[currentDate.getMonth()]} {selectedDate}
                            </h3>
                            <div className="space-y-4">
                                {/* Exams Section */}
                                {getExamsForDay(selectedDate).length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-blue-400 uppercase">Exams</h4>
                                        {getExamsForDay(selectedDate).map(exam => (
                                            <div key={exam._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700 relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: exam.color }} />
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white leading-tight">{exam.title}</h4>
                                                    <p className="text-xs text-gray-400">{exam.subject}</p>
                                                </div>
                                                <div className="px-2 py-1 rounded bg-white/5 text-xs font-mono text-gray-300 border border-white/10">
                                                    EXAM
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Tasks Section */}
                                <div className="space-y-2">
                                    {getTasksForDay(selectedDate).length > 0 && getExamsForDay(selectedDate).length > 0 && (
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase">Tasks</h4>
                                    )}
                                    {getTasksForDay(selectedDate).length > 0 ? (
                                        getTasksForDay(selectedDate).map(task => (
                                            <div key={task._id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800 border border-gray-700">
                                                <div className={`w-2 h-2 rounded-[2px] ${task.completed ? 'bg-green-400/80' : task.priority === 'high' ? 'bg-purple-500' : 'bg-gray-400'}`} />
                                                <p className={`text-sm text-gray-200 flex-1 ${task.completed ? 'line-through opacity-50' : ''}`}>
                                                    {task.title}
                                                </p>
                                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-900 rounded">
                                                    {task.estimatedTime}m
                                                </span>
                                            </div>
                                        ))
                                    ) : getExamsForDay(selectedDate).length === 0 && (
                                        <p className="text-gray-500 text-sm italic">No tasks or exams scheduled.</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarView;
