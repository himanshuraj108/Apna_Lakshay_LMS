const User = require('../models/User');
const StudyStreak = require('../models/StudyStreak');
const DailyQuiz = require('../models/DailyQuiz');
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const Notification = require('../models/Notification');
const PomodoroSession = require('../models/PomodoroSession');
const { callGroq, extractJSON } = require('./mockTestController');
const { getClient } = require('../utils/redis');

// Helper to get India Standard Time (UTC+5:30) date string (YYYY-MM-DD)
const getISTDateString = (date = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date); // e.g. "2026-05-21"
};

// Central helper to update student activity streak and XP
const updateStreakAndXP = async (userId, xpAmount = 0, activityType = 'other') => {
    try {
        let stats = await StudyStreak.findOne({ user: userId });
        if (!stats) {
            stats = await StudyStreak.create({ user: userId });
        }

        const todayStr = getISTDateString(new Date());
        const lastActiveStr = stats.lastActivityDate ? getISTDateString(stats.lastActivityDate) : null;

        if (!lastActiveStr) {
            stats.currentStreak = 1;
            stats.longestStreak = Math.max(stats.longestStreak, 1);
        } else if (todayStr !== lastActiveStr) {
            const todayDate = new Date(todayStr);
            const lastActiveDate = new Date(lastActiveStr);
            const diffTime = Math.abs(todayDate - lastActiveDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                stats.currentStreak += 1;
            } else {
                stats.currentStreak = 1;
            }
            stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
        }

        stats.lastActivityDate = new Date();

        // Update Activity Log for Heatmap
        const logIndex = stats.activityLog.findIndex(log => getISTDateString(log.date) === todayStr);
        if (logIndex > -1) {
            stats.activityLog[logIndex].count += 1;
        } else {
            stats.activityLog.push({ date: new Date(), count: 1 });
        }

        // Award XP
        if (xpAmount > 0) {
            stats.totalXP += xpAmount;
            stats.level = Math.floor(stats.totalXP / 1000) + 1;
        }

        // Check Achievements & Milestone Rewards
        const achievementsList = [
            { id: 'streak_5', days: 5, reward: 2, title: '5-Day Streak Explorer' },
            { id: 'streak_10', days: 10, reward: 5, title: '10-Day Streak Warrior' },
            { id: 'streak_15', days: 15, reward: 8, title: '15-Day Streak Master' },
            { id: 'streak_30', days: 30, reward: 15, title: '30-Day Streak Legend' }
        ];

        for (const ach of achievementsList) {
            if (stats.currentStreak >= ach.days) {
                const alreadyUnlocked = stats.achievements.some(a => a.id === ach.id);
                if (!alreadyUnlocked) {
                    stats.achievements.push({
                        id: ach.id,
                        unlockedAt: new Date()
                    });

                    // Award bonus mock test credits to User
                    const user = await User.findById(userId);
                    if (user) {
                        user.bonusMockTestCredits = (user.bonusMockTestCredits || 0) + ach.reward;
                        await user.save({ validateBeforeSave: false });
                    }

                    // Create in-app notification
                    await Notification.create({
                        recipient: userId,
                        title: `Achievement Unlocked: ${ach.title}!`,
                        message: `Congratulations! You reached a ${ach.days}-day study streak. You've been rewarded with ${ach.reward} bonus mock test credits!`,
                        type: 'general',
                        createdBy: userId
                    });
                }
            }
        }

        // Invalidate leaderboard caches when XP/Streaks are updated
        try {
            const redis = getClient();
            await redis.del('leaderboard:xp');
            await redis.del('leaderboard:streak');
            await redis.del('leaderboard:focus');
        } catch (err) {
            console.error('Failed to clear leaderboard cache:', err.message);
        }

        await stats.save();
        return stats;
    } catch (error) {
        console.error('Error updating streak and XP:', error);
        throw error;
    }
};

// @desc    Get Streak and XP Stats
// @route   GET /api/student/engagement/streak-stats
const getStreakStats = async (req, res) => {
    try {
        let stats = await StudyStreak.findOne({ user: req.user.id });
        if (!stats) {
            stats = await StudyStreak.create({ user: req.user.id });
        }

        const todayStr = getISTDateString(new Date());

        // Check if student completed today's quiz
        const hasQuizAttempt = await DailyQuizAttempt.exists({ user: req.user.id, date: todayStr });

        // Check if student checked in today
        const Attendance = require('../models/Attendance');
        const getISTMidnight = () => {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            const ist = new Date(utc + (3600000 * 5.5));
            ist.setHours(0,0,0,0);
            return ist;
        };
        const hasAttendance = await Attendance.exists({ student: req.user.id, date: getISTMidnight(), status: 'present' });

        res.json({
            success: true,
            stats: {
                currentStreak: stats.currentStreak,
                longestStreak: stats.longestStreak,
                totalXP: stats.totalXP,
                level: stats.level,
                tasksCompleted: stats.tasksCompleted,
                totalFocusTime: stats.totalFocusTime,
                achievements: stats.achievements,
                activityLog: stats.activityLog
            },
            completedToday: {
                quiz: !!hasQuizAttempt,
                attendance: !!hasAttendance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const { sortBy = 'xp' } = req.query;
        const cacheKey = `leaderboard:${sortBy}`;
        const redis = getClient();

        // Try to fetch from Redis cache first
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return res.json({ success: true, leaderboard: JSON.parse(cached), fromCache: true });
            }
        } catch (cacheErr) {
            console.error('Redis get leaderboard failed:', cacheErr.message);
        }

        // Fetch all active students who are not disabled
        const students = await User.find({ role: 'student', isActive: true, isDisabled: { $ne: true } })
            .select('name studentId profileImage');

        // Fetch StudyStreak records for these students
        const studentIds = students.map(s => s._id);
        const streaks = await StudyStreak.find({ user: { $in: studentIds } });

        // Map streaks by student ID string
        const streakMap = {};
        streaks.forEach(s => {
            if (s.user) {
                streakMap[s.user.toString()] = s;
            }
        });

        // Combine student and streak details into a leaderboard record
        const cleanLeaderboard = students.map(student => {
            const streak = streakMap[student._id.toString()] || {
                totalXP: 0,
                currentStreak: 0,
                totalFocusTime: 0,
                level: 1
            };

            return {
                userId: student._id,
                name: student.name,
                studentId: student.studentId,
                profileImage: student.profileImage,
                value: sortBy === 'xp' ? (streak.totalXP || 0) : sortBy === 'streak' ? (streak.currentStreak || 0) : (streak.totalFocusTime || 0),
                level: streak.level || 1
            };
        });

        // Sort in descending order based on the requested value
        cleanLeaderboard.sort((a, b) => b.value - a.value);

        // Assign ranks to the sorted records
        cleanLeaderboard.forEach((item, index) => {
            item.rank = index + 1;
        });

        // Cache in Redis for 60 seconds
        try {
            await redis.set(cacheKey, JSON.stringify(cleanLeaderboard), 'EX', 60);
        } catch (cacheErr) {
            console.error('Redis set leaderboard failed:', cacheErr.message);
        }

        res.json({ success: true, leaderboard: cleanLeaderboard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Helper for Daily Quiz prompt and topics configuration
const EXAM_TOPIC_GUIDES = {
    'ssc_cgl': { name: 'SSC CGL', topics: 'Quantitative Aptitude, General Intelligence & Reasoning, English Comprehension, General Science, Indian History, Geography' },
    'ssc_chsl': { name: 'SSC CHSL', topics: 'Quantitative Aptitude, General Intelligence, English Language, General Awareness' },
    'ssc_gd': { name: 'SSC GD Constable', topics: 'Elementary Mathematics, General Intelligence & Reasoning, General Knowledge, Basic English/Hindi' },
    'ssc_mts': { name: 'SSC MTS', topics: 'Numerical Aptitude, General Intelligence & Reasoning, General English, General Awareness' },
    'ssc_cpo': { name: 'SSC CPO', topics: 'Quantitative Aptitude, General Intelligence & Reasoning, English Comprehension, General Awareness' },
    'upsc_cse': { name: 'UPSC CSE', topics: 'Indian Polity & Governance, Indian History & Culture, Geography of India and World, Economic Development, Environment & General Science, National & International Current Events' },
    'upsc_cds': { name: 'UPSC CDS', topics: 'Elementary Mathematics, General English, General Knowledge (History, Geography, Physics, Chemistry, Biology)' },
    'ibps_po': { name: 'IBPS PO', topics: 'Quantitative Aptitude, Logical Reasoning Ability, English Language, Financial & Banking Awareness' },
    'ibps_clerk': { name: 'IBPS Clerk', topics: 'Quantitative Aptitude, Reasoning Ability, English Language, General/Financial Awareness' },
    'sbi_po': { name: 'SBI PO', topics: 'Data Analysis & Interpretation, Reasoning Ability, English Language, General/Economy/Banking Awareness' },
    'sbi_clerk': { name: 'SBI Clerk', topics: 'Quantitative Aptitude, Reasoning Ability, General English, Financial Awareness' },
    'rrb_ntpc': { name: 'RRB NTPC', topics: 'Mathematics, General Intelligence & Reasoning, General Awareness (Current Events, General Science, Social Studies)' },
    'jee_main': { name: 'JEE Main', topics: 'Physics (Mechanics, Thermodynamics, Electrostatics), Chemistry (Physical, Organic, Inorganic), Mathematics (Calculus, Algebra, Coordinate Geometry)' },
    'neet_ug': { name: 'NEET UG', topics: 'Physics (Mechanics, Electrodynamics, Optics, Thermodynamics, Modern Physics), Chemistry (Physical, Inorganic, Organic Chemistry), Biology (Human Physiology, Plant Physiology, Genetics, Evolution, Cell Structure, Ecology)' },
    'class_6': { name: 'Class 6 Standard', topics: 'Mathematics (Fractions, Algebra, Decimals, Geometry), Science (Food, Plants, Light, Electricity, Body Movements), Social Science (Ancient History, Earth & Maps, Local Government), English Grammar & Reading' },
    'class_7': { name: 'Class 7 Standard', topics: 'Mathematics (Integers, Decimals, Fractions, Simple Equations, Congruence), Science (Nutrition in Plants & Animals, Heat, Acids, Weather, Motion, Forest), Social Science (Medieval India, Environment, State Government), English Grammar & Reading' },
    'class_8': { name: 'Class 8 Standard', topics: 'Mathematics (Rational Numbers, Linear Equations, Quadrilaterals, Mensuration), Science (Crop Production, Microorganisms, Combustion, Cell, Force, Friction, Sound), Social Science (Modern History, Resources, Indian Constitution), English Grammar & Reading' },
    'class_9': { name: 'Class 9 Standard', topics: 'Mathematics (Number Systems, Polynomials, Coordinate Geometry, Triangles, Quadrilaterals), Science (Matter, Atoms, Cell, Tissues, Motion, Force, Gravity, Work, Sound), Social Science (French Revolution, Physical Features of India, Electoral Politics), English Grammar & Reading' },
    'class_10': { name: 'Class 10 Standard', topics: 'Mathematics (Real Numbers, Polynomials, Quadratic Equations, Trigonometry, Coordinate Geometry, Statistics), Science (Chemical Reactions, Acids & Bases, Life Processes, Light, Electricity, Carbon Compounds), Social Science (Nationalism in India, Resources, Democratic Politics), English Grammar & Reading' },
    'class_11': { name: 'Class 11 Standard (Science)', topics: 'Physics (Kinematics, Laws of Motion, Work, Gravitation, Thermodynamics), Chemistry (Structure of Atom, Chemical Bonding, States of Matter, Thermodynamics, Hydrocarbons), Mathematics (Sets, Trigonometric Functions, Complex Numbers, Limits), Biology (Diversity, Cell Structure, Plant & Human Physiology)' },
    'class_12': { name: 'Class 12 Standard (Science)', topics: 'Physics (Electrostatics, Current Electricity, Magnetism, Optics, Modern Physics), Chemistry (Solutions, Electrochemistry, Kinetics, Coordination Compounds, Organic Chemistry), Mathematics (Relations & Functions, Calculus, Vectors, 3D Geometry, Probability), Biology (Reproduction, Genetics, Biotechnology, Ecology)' },
    'generic': { name: 'General Aptitude & Knowledge', topics: 'Basic Mathematics, Verbal Ability & Grammar, Logical Reasoning, General Awareness' }
};

// @desc    Get Daily Target Quiz (Fetch or generate using Groq)
// @route   GET /api/student/engagement/daily-quiz
const getDailyQuiz = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const examCode = user.examTarget || 'generic';
        const todayStr = getISTDateString(new Date());

        // Check if student has already completed today's quiz
        const existingAttempt = await DailyQuizAttempt.findOne({ user: user._id, date: todayStr });

        // Search for cached daily quiz
        let quiz = await DailyQuiz.findOne({ date: todayStr, examCode });

        if (!quiz) {
            // Generate using Groq
            const config = EXAM_TOPIC_GUIDES[examCode] || EXAM_TOPIC_GUIDES['generic'];
            
            const systemPrompt = 'You are an expert exam coach for Indian competitive exams. Always respond with ONLY a valid JSON object containing a "questions" array, and nothing else.';
            const userPrompt = `Generate exactly 5 unique hard-difficulty MCQ questions for the competitive exam: ${config.name}.
Topics to draw from: ${config.topics}.
Each question must be a multiple choice question with exactly 4 options.
Respond with ONLY a raw JSON object — no markdown fences, no extra text.
The JSON object must have a "questions" key containing an array of 5 objects.
Each question object must have:
  "question": string (the question text)
  "options": array of exactly 4 strings
  "correct": integer 0-3 (representing the correct option index, where 0=A, 1=B, 2=C, 3=D)
  "explanation": string (one sentence explanation of the correct answer)
  "subject": string (the subject or topic of this question)`;

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            try {
                const rawResponse = await callGroq(messages);
                const parsed = extractJSON(rawResponse);
                
                let questions = parsed?.questions || (Array.isArray(parsed) ? parsed : []);
                
                // Validate questions format
                questions = questions.filter(q =>
                    q &&
                    typeof q.question === 'string' && q.question.trim().length > 0 &&
                    Array.isArray(q.options) && q.options.length === 4 &&
                    typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
                );

                if (questions.length < 5) {
                    throw new Error('Groq generated incomplete or malformed questions');
                }

                // Slice exactly 5 questions
                questions = questions.slice(0, 5);

                // Save to database daily cache
                try {
                    quiz = await DailyQuiz.create({
                        date: todayStr,
                        examCode,
                        questions
                    });
                } catch (dbErr) {
                    // In case of parallel execution causing duplicate key error, fetch the newly created record
                    if (dbErr.code === 11000) {
                        quiz = await DailyQuiz.findOne({ date: todayStr, examCode });
                    } else {
                        throw dbErr;
                    }
                }
            } catch (groqError) {
                console.error('Groq Quiz Generation Failed:', groqError);
                return res.status(500).json({
                    success: false,
                    message: 'Daily challenge is currently offline. Please try again in a few minutes.'
                });
            }
        }

        res.json({
            success: true,
            quiz: {
                _id: quiz._id,
                date: quiz.date,
                examCode: quiz.examCode,
                // Hide correct answers and explanations if not yet attempted
                questions: quiz.questions.map(q => ({
                    _id: q._id,
                    question: q.question,
                    options: q.options,
                    subject: q.subject
                }))
            },
            attempted: !!existingAttempt,
            attempt: existingAttempt ? {
                score: existingAttempt.score,
                answers: existingAttempt.answers,
                xpAwarded: existingAttempt.xpAwarded,
                questionsWithSolutions: quiz.questions // return solutions if already completed
            } : null
        });

    } catch (error) {
        console.error('getDailyQuiz Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Submit Daily Target Quiz
// @route   POST /api/student/engagement/daily-quiz/submit
const submitDailyQuiz = async (req, res) => {
    try {
        const { answers } = req.body; // Array of selected option indices (0-3)
        if (!Array.isArray(answers) || answers.length !== 5) {
            return res.status(400).json({ success: false, message: 'Please answer all 5 questions.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const examCode = user.examTarget || 'generic';
        const todayStr = getISTDateString(new Date());

        // Validate single attempt lock
        const existingAttempt = await DailyQuizAttempt.findOne({ user: user._id, date: todayStr });
        if (existingAttempt) {
            return res.status(400).json({ success: false, message: 'You have already attempted today\'s quiz challenge.' });
        }

        // Get the cached quiz
        const quiz = await DailyQuiz.findOne({ date: todayStr, examCode });
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Today\'s quiz not found. Please retrieve it first.' });
        }

        // Evaluate answers
        let score = 0;
        for (let i = 0; i < 5; i++) {
            if (answers[i] === quiz.questions[i].correct) {
                score += 1;
            }
        }

        // XP Rules: 10 XP per correct option + 20 XP participation bonus
        const xpAwarded = (score * 10) + 20;

        // Save Attempt
        const attempt = await DailyQuizAttempt.create({
            user: user._id,
            quiz: quiz._id,
            date: todayStr,
            answers,
            score,
            xpAwarded
        });

        // Update student streak and award XP
        const updatedStats = await updateStreakAndXP(user._id, xpAwarded, 'quiz');

        res.status(201).json({
            success: true,
            message: `Quiz submitted successfully! Score: ${score}/5 (+${xpAwarded} XP)`,
            attempt: {
                score: attempt.score,
                answers: attempt.answers,
                xpAwarded: attempt.xpAwarded,
                questionsWithSolutions: quiz.questions
            },
            stats: {
                currentStreak: updatedStats.currentStreak,
                level: updatedStats.level,
                totalXP: updatedStats.totalXP
            }
        });

    } catch (error) {
        console.error('submitDailyQuiz Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    updateStreakAndXP,
    getStreakStats,
    getLeaderboard,
    getDailyQuiz,
    submitDailyQuiz
};
