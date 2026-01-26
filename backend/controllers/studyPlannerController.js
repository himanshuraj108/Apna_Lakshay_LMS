const StudyTask = require('../models/StudyTask');
const PomodoroSession = require('../models/PomodoroSession');
const StudyStreak = require('../models/StudyStreak');
const Exam = require('../models/Exam');
const User = require('../models/User');

// @desc    Get all exams
// @route   GET /api/study/exams
exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find({ userId: req.user._id }).sort({ date: 1 });
        res.status(200).json({ success: true, exams });
    } catch (error) {
        console.error('Get Exams Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create an exam
// @route   POST /api/study/exams
exports.createExam = async (req, res) => {
    try {
        const exam = await Exam.create({
            userId: req.user._id,
            ...req.body
        });
        res.status(201).json({ success: true, exam });
    } catch (error) {
        console.error('Create Exam Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete an exam
// @route   DELETE /api/study/exams/:id
exports.deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
        res.status(200).json({ success: true, message: 'Exam deleted' });
    } catch (error) {
        console.error('Delete Exam Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Helper to calculate XP
// Helper to calculate XP (Time Based)
const calculateXP = (task) => {
    // 1 Minute = 1 XP
    let xp = task.estimatedTime || 0;

    // Fallback: If no estimated time, give minimal base XP
    if (xp <= 0) xp = 10;

    return xp;
};

// @desc    Get all tasks
// @route   GET /api/study/tasks
exports.getTasks = async (req, res) => {
    try {
        const tasks = await StudyTask.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, tasks });
    } catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a task
// @route   POST /api/study/tasks
exports.createTask = async (req, res) => {
    try {
        const task = await StudyTask.create({
            user: req.user._id,
            ...req.body
        });
        res.status(201).json({ success: true, task });
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a task
// @route   PATCH /api/study/tasks/:id
exports.updateTask = async (req, res) => {
    try {

        const task = await StudyTask.findOne({ _id: req.params.id, user: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });


        // Check if completing task
        if (req.body.completed && !task.completed) {

            req.body.completedAt = new Date();

            // Handle Gamification (Streak & XP)
            let stats = await StudyStreak.findOne({ user: req.user._id });
            if (!stats) {
                stats = await StudyStreak.create({ user: req.user._id });
            }

            if (stats) {
                // ... (existing completion logic)

                // Update Streak Logic (Simplified)
                const today = new Date().setHours(0, 0, 0, 0);
                const lastActive = stats.lastActivityDate ? new Date(stats.lastActivityDate).setHours(0, 0, 0, 0) : 0;

                if (today > lastActive) {
                    if (today - lastActive === 86400000) { // Consecutive day
                        stats.currentStreak += 1;
                    } else if (today !== lastActive) { // Broken streak
                        stats.currentStreak = 1;
                    }
                    stats.lastActivityDate = new Date();
                    if (stats.currentStreak > stats.longestStreak) stats.longestStreak = stats.currentStreak;
                }

                // Update Activity Log for Heatmap
                const logIndex = stats.activityLog.findIndex(log =>
                    new Date(log.date).setHours(0, 0, 0, 0) === today
                );

                if (logIndex > -1) {
                    stats.activityLog[logIndex].count += 1;
                } else {
                    stats.activityLog.push({ date: new Date(), count: 1 });
                }

                // Award XP
                const xp = calculateXP({ ...task.toObject(), ...req.body });
                stats.totalXP += xp;
                stats.tasksCompleted += 1;
                // Level up logic (e.g., every 1000 XP)
                stats.level = Math.floor(stats.totalXP / 1000) + 1;

                await stats.save();
                req.body.xpAwarded = xp;
            }
        } else if (req.body.completed === false && task.completed) {

            // Task Un-Check Logic (Reversal)
            const stats = await StudyStreak.findOne({ user: req.user._id });

            // Calculate XP to remove (as if it was just completed)
            const xpToRemove = calculateXP({ ...task.toObject(), completed: true });

            stats.totalXP = Math.max(0, stats.totalXP - xpToRemove);
            stats.tasksCompleted = Math.max(0, stats.tasksCompleted - 1);

            // Revert Activity Log
            const today = new Date().setHours(0, 0, 0, 0);
            const logIndex = stats.activityLog.findIndex(log =>
                new Date(log.date).setHours(0, 0, 0, 0) === today
            );

            if (logIndex > -1) {
                stats.activityLog[logIndex].count = Math.max(0, stats.activityLog[logIndex].count - 1);

                // If count drops to 0, it means we undid the only task for today
                // If streak was incremented/maintained today, we should technically revert it
                // Simplified Check: If lastActivityDate is today, decrement streak
                const lastActive = stats.lastActivityDate ? new Date(stats.lastActivityDate).setHours(0, 0, 0, 0) : 0;
                if (stats.activityLog[logIndex].count === 0 && lastActive === today) {
                    stats.currentStreak = Math.max(0, stats.currentStreak - 1);
                }
                stats.markModified('activityLog');
            }

            await stats.save();
        }
        req.body.completedAt = null;

        const updatedTask = await StudyTask.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, task: updatedTask });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/study/tasks/:id
exports.deleteTask = async (req, res) => {
    try {
        const task = await StudyTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, message: 'Task deleted' });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Log Pomodoro Session
// @route   POST /api/study/pomodoro
exports.logPomodoro = async (req, res) => {
    try {
        const { taskId, duration, type } = req.body;

        await PomodoroSession.create({
            user: req.user._id,
            task: taskId || null,
            duration,
            type
        });

        // Update Stats
        let stats = await StudyStreak.findOne({ user: req.user._id });
        if (!stats) {
            stats = await StudyStreak.create({ user: req.user._id });
        }

        if (type === 'focus') {
            stats.totalFocusTime += duration;
            stats.totalXP += 5 * (duration / 25); // 5 XP per 25 mins
            await stats.save();
        }

        // If linked to task, update task stats
        if (taskId) {
            await StudyTask.findByIdAndUpdate(taskId, {
                $inc: {
                    pomodoroSessions: 1,
                    totalFocusTime: duration
                }
            });
        }

        res.status(201).json({ success: true, message: 'Session logged' });
    } catch (error) {
        console.error('Log Pomodoro Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get Analytics & Stats
// @route   GET /api/study/stats
exports.getStats = async (req, res) => {
    try {
        let stats = await StudyStreak.findOne({ user: req.user._id });
        if (!stats) {
            stats = await StudyStreak.create({ user: req.user._id });
        }
        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
