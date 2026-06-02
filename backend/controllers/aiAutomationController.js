const { callGroq, extractJSON } = require('./mockTestController');
const { updateStreakAndXP } = require('./engagementController');
const User = require('../models/User');
const StudyStreak = require('../models/StudyStreak');
const MockTestAttempt = require('../models/MockTestAttempt');
const Attendance = require('../models/Attendance');
const AIActivityLog = require('../models/AIActivityLog');

const logAIActivity = async (req, toolName, details, payload = null) => {
    try {
        if (!req.user) return;
        await AIActivityLog.create({
            student: req.user.id,
            studentName: req.user.name,
            studentEmail: req.user.email,
            toolName,
            details,
            payload
        });
        // Award +5 XP for every AI tool usage (once logged)
        await updateStreakAndXP(req.user.id, 5, 'ai_tool');
    } catch (e) {
        console.error('Failed to log AI activity:', e.message);
    }
};

// ─── Helper: get today's date string in IST ───────────────────────────────────
const todayIST = () =>
    new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

// ─── Feature 1: AI Study Plan Generator ──────────────────────────────────────
// POST /api/student/ai/generate-study-plan
exports.generateStudyPlan = async (req, res) => {
    try {
        const { examTarget, examDate, studyHoursPerDay = 6, weakSubjects = [] } = req.body;
        if (!examTarget || !examDate) {
            return res.status(400).json({ success: false, message: 'Exam target and exam date are required.' });
        }

        const targetDate = new Date(examDate);
        const today = new Date();
        const daysLeft = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)));
        const weeksLeft = Math.ceil(daysLeft / 7);

        const messages = [
            {
                role: 'system',
                content: `You are an expert study planner for Indian competitive exams. Generate a practical, week-wise study plan in JSON format only. No markdown, no extra text — only valid JSON.`
            },
            {
                role: 'user',
                content: `Create a study plan for:
Exam: ${examTarget}
Days left: ${daysLeft} (${weeksLeft} weeks)
Study hours per day: ${studyHoursPerDay}
Weak subjects: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'None specified'}

Return ONLY a JSON object with this exact structure:
{
  "summary": "One sentence overview of the plan. If the exam is more than 30 days away, explicitly describe this as the initial 4-week kickstart/foundational phase of their long-term preparation (e.g. 'Initial 4-week kickstart phase for long-term NEET UG preparation').",
  "daysLeft": ${daysLeft},
  "weeklyPlans": [
    {
      "week": 1,
      "focus": "Main focus for this week",
      "days": [
        {
          "day": "Monday",
          "subject": "Subject name",
          "topics": "Specific topics to cover",
          "hours": 3,
          "priority": "high|medium|low"
        }
      ]
    }
  ],
  "tips": ["tip1", "tip2", "tip3"]
}

Generate ${Math.min(weeksLeft, 4)} weeks maximum. Each week should have 6 days (Sunday as rest). Keep it practical for ${examTarget} exam preparation.`
            }
        ];

        const raw = await callGroq(messages);
        let plan;
        try {
            const match = raw.match(/\{[\s\S]*\}/);
            plan = JSON.parse(match ? match[0] : raw);
        } catch {
            return res.status(500).json({ success: false, message: 'Failed to parse AI response. Try again.' });
        }

        await logAIActivity(req, 'Study Planner', `Generated study plan for ${examTarget}`, plan);
        res.json({ success: true, plan });
    } catch (err) {
        console.error('Study plan error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate study plan. Try again.' });
    }
};

// ─── Feature 2: AI Mock Test Performance Analyzer ────────────────────────────
// POST /api/student/ai/analyze-test
exports.analyzeTest = async (req, res) => {
    try {
        const { examType, sectionScores, totalScore, maxScore, percentage, wrongQuestions = [] } = req.body;
        if (!examType || totalScore == null || maxScore == null) {
            return res.status(400).json({ success: false, message: 'examType, totalScore, and maxScore are required.' });
        }

        const wrongSummary = wrongQuestions.slice(0, 10).map(q =>
            `Q: ${q.question?.slice(0, 80) || 'N/A'} | Correct: ${q.correct || 'N/A'} | Student: ${q.selected || 'Not answered'}`
        ).join('\n');

        const sectionText = sectionScores
            ? Object.entries(sectionScores).map(([sec, sc]) => `${sec}: ${sc.correct}/${sc.total}`).join(', ')
            : 'Not available';

        const messages = [
            {
                role: 'system',
                content: `You are a performance coach for Indian competitive exams. Analyze the student's mock test performance and give personalized, actionable feedback. Return ONLY valid JSON, no markdown.`
            },
            {
                role: 'user',
                content: `Analyze this mock test result:
Exam: ${examType}
Score: ${totalScore}/${maxScore} (${percentage}%)
Section wise: ${sectionText}
Wrong questions sample:
${wrongSummary || 'No details available'}

Return ONLY this JSON:
{
  "overallRating": "Excellent|Good|Average|Needs Improvement",
  "ratingColor": "green|yellow|orange|red",
  "summary": "2-3 sentence honest performance summary",
  "weakAreas": [
    { "topic": "topic name", "reason": "why it's weak", "action": "what to do" }
  ],
  "strongAreas": ["area1", "area2"],
  "revisionPlan": [
    { "subject": "subject", "priority": "high|medium|low", "suggestion": "specific revision advice" }
  ],
  "examTips": ["tip1", "tip2", "tip3"],
  "nextSteps": "One clear paragraph about what to do in the next 3 days"
}`
            }
        ];

        const raw = await callGroq(messages);
        let analysis;
        try {
            const match = raw.match(/\{[\s\S]*\}/);
            analysis = JSON.parse(match ? match[0] : raw);
        } catch {
            return res.status(500).json({ success: false, message: 'Failed to parse analysis. Try again.' });
        }

        await logAIActivity(req, 'Test Analyzer', `Analyzed test result for ${examType} (Score: ${totalScore}/${maxScore})`, analysis);
        res.json({ success: true, analysis });
    } catch (err) {
        console.error('Test analysis error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to analyze test. Try again.' });
    }
};

// ─── Feature 3: AI Notes Summarizer ──────────────────────────────────────────
// POST /api/student/ai/summarize-notes
exports.summarizeNotes = async (req, res) => {
    try {
        const { text, subject = 'general' } = req.body;
        if (!text || text.trim().length < 30) {
            return res.status(400).json({ success: false, message: 'Please provide at least 30 characters of text to summarize.' });
        }
        if (text.length > 4000) {
            return res.status(400).json({ success: false, message: 'Text too long. Maximum 4000 characters.' });
        }

        const messages = [
            {
                role: 'system',
                content: `You are a study assistant for Indian competitive exam students. Summarize notes, extract key facts, and generate practice questions. Return ONLY valid JSON, no markdown.`
            },
            {
                role: 'user',
                content: `Analyze and summarize this study material (subject: ${subject}):

"${text.trim()}"

Return ONLY this JSON:
{
  "title": "Short descriptive title for this content",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "importantFacts": [
    { "fact": "fact text", "importance": "why this is exam-relevant" }
  ],
  "summary": "3-4 sentence concise summary",
  "practiceQuestions": [
    {
      "question": "MCQ question text",
      "options": ["A", "B", "C", "D"],
      "answer": "correct option letter",
      "explanation": "why this is the answer"
    }
  ],
  "examRelevance": "Which exams this topic is important for"
}`
            }
        ];

        const raw = await callGroq(messages);
        let result;
        try {
            const match = raw.match(/\{[\s\S]*\}/);
            result = JSON.parse(match ? match[0] : raw);
        } catch {
            return res.status(500).json({ success: false, message: 'Failed to parse summary. Try again.' });
        }

        await logAIActivity(req, 'Notes Summarizer', `Summarized ${subject} notes (${text.length} chars)`, result);
        res.json({ success: true, result });
    } catch (err) {
        console.error('Summarize error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to summarize. Try again.' });
    }
};

// ─── Feature 4: AI Current Affairs Quiz Generator ────────────────────────────
// POST /api/student/ai/quiz-from-article
exports.quizFromArticle = async (req, res) => {
    try {
        const { title, source, category } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: 'Article title is required.' });
        }

        const messages = [
            {
                role: 'system',
                content: `You are a current affairs quiz generator for Indian competitive exams (SSC, UPSC, Banking, RRB). Generate MCQ questions based on news articles. Return ONLY valid JSON, no markdown.`
            },
            {
                role: 'user',
                content: `Generate 3 MCQ questions based on this current affairs article:
Title: "${title}"
Source: ${source || 'News'}
Category: ${category || 'General'}

Return ONLY this JSON:
{
  "questions": [
    {
      "question": "Complete MCQ question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer": "A|B|C|D",
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}`
            }
        ];

        const raw = await callGroq(messages);
        let result;
        try {
            const match = raw.match(/\{[\s\S]*\}/);
            result = JSON.parse(match ? match[0] : raw);
        } catch {
            return res.status(500).json({ success: false, message: 'Failed to generate quiz. Try again.' });
        }

        await logAIActivity(req, 'News Quiz', `Generated quiz from article: "${title}"`, result);
        res.json({ success: true, questions: result.questions || [] });
    } catch (err) {
        console.error('Quiz from article error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate quiz. Try again.' });
    }
};

// ─── Feature 5: AI Smart Task Suggestions ────────────────────────────────────
// POST /api/student/ai/suggest-tasks
exports.suggestTasks = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await User.findById(studentId).select('examTarget streak').lean();
        const { pendingTasks = [], currentStreak = 0 } = req.body;

        const examTarget = student?.examTarget || 'SSC CGL';
        const streak = student?.streak || currentStreak;

        const pendingText = pendingTasks.slice(0, 5).map(t => `- ${t.title} (${t.priority || 'medium'} priority)`).join('\n') || 'None';

        const messages = [
            {
                role: 'system',
                content: `You are a smart study task advisor for Indian competitive exam students. Suggest specific, actionable study tasks. Return ONLY valid JSON, no markdown.`
            },
            {
                role: 'user',
                content: `Suggest 3 specific study tasks for today:
Exam target: ${examTarget}
Current streak: ${streak} days
Pending tasks:
${pendingText}

Return ONLY this JSON:
{
  "suggestions": [
    {
      "title": "Specific task title (under 60 chars)",
      "subject": "Subject name",
      "estimatedMinutes": 45,
      "priority": "high|medium|low",
      "reason": "Why this task is important today (1 sentence)"
    }
  ],
  "motivationTip": "One motivational sentence based on their streak"
}`
            }
        ];

        const raw = await callGroq(messages);
        let result;
        try {
            const match = raw.match(/\{[\s\S]*\}/);
            result = JSON.parse(match ? match[0] : raw);
        } catch {
            return res.status(500).json({ success: false, message: 'Failed to generate suggestions. Try again.' });
        }

        await logAIActivity(req, 'Task Suggestions', `Requested daily task suggestions for ${examTarget}`, result);
        res.json({ success: true, suggestions: result.suggestions || [], motivationTip: result.motivationTip || '' });
    } catch (err) {
        console.error('Task suggestion error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate suggestions. Try again.' });
    }
};

// ─── Feature 6: Exam Readiness Score ─────────────────────────────────────────
// GET /api/student/ai/readiness-score
exports.getReadinessScore = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Fetch student data
        const student = await User.findById(studentId)
            .select('streak doubtCredits examTarget')
            .lean();

        // Fetch recent attendance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const attRecords = await Attendance.find({
            student: studentId,
            date: { $gte: thirtyDaysAgo }
        }).lean();
        const attPresent = attRecords.filter(a => a.status === 'present').length;
        const attTotal = attRecords.length || 1;
        const attPct = Math.round((attPresent / attTotal) * 100);

        // Fetch recent mock test scores
        let mockAvg = 0;
        let mockCount = 0;
        try {
            const recentTests = await MockTestAttempt.find({
                user: studentId,
                percentage: { $exists: true, $gt: 0 }  // any attempt that was actually scored
            })
                .sort({ completedAt: -1, updatedAt: -1 })
                .limit(5)
                .select('percentage')
                .lean();
            if (recentTests.length > 0) {
                mockAvg = Math.round(recentTests.reduce((sum, t) => sum + (t.percentage || 0), 0) / recentTests.length);
                mockCount = recentTests.length;
            }
        } catch (e) { console.error('Error fetching mock tests for readiness score:', e); }

        // Fetch streak from StudyStreak model (NOT from User.streak which doesn't exist)
        const studyStreak = await StudyStreak.findOne({ user: studentId }).lean();
        const streak = studyStreak?.currentStreak || 0;

        // Fetch AI engagement — count of AI tool sessions used today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const aiSessionsToday = await AIActivityLog.countDocuments({
            student: studentId,
            createdAt: { $gte: todayStart }
        });

        const examTarget = student?.examTarget || 'General';

        // Calculate weighted readiness score
        const streakScore      = Math.min(streak * 3, 25);              // Max 25 pts (streak ≥ 9 days)
        const attScore         = Math.round(attPct * 0.25);             // Max 25 pts (100% attendance)
        const mockScore        = Math.round(mockAvg * 0.3);             // Max 30 pts (100% mock avg)
        const engagementScore  = Math.min(aiSessionsToday * 5, 20);     // Max 20 pts (4+ AI sessions)

        const totalScore = Math.min(100, streakScore + attScore + mockScore + engagementScore);

        const breakdown = [
            { label: 'Study Streak',   score: streakScore,     max: 25, detail: `${streak} day streak` },
            { label: 'Attendance',     score: attScore,         max: 25, detail: `${attPct}% in last 30 days` },
            { label: 'Mock Tests',     score: mockScore,        max: 30, detail: mockCount > 0 ? `Avg ${mockAvg}% in ${mockCount} tests` : 'No tests taken' },
            { label: 'AI Engagement',  score: engagementScore,  max: 20, detail: `${aiSessionsToday} AI sessions today` },
        ];

        const level = totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Average' : 'Needs Work';
        const color = totalScore >= 80 ? '#16a34a' : totalScore >= 60 ? '#2563eb' : totalScore >= 40 ? '#f59e0b' : '#ef4444';

        // Generate AI insight
        const messages = [
            {
                role: 'system',
                content: `You are a study coach. Give a concise, motivating insight in 1 sentence (max 20 words).`
            },
            {
                role: 'user',
                content: `Student readiness: ${totalScore}%. Streak: ${streak} days. Attendance: ${attPct}%. Mock avg: ${mockAvg}%. Target: ${examTarget}. Give one motivating insight.`
            }
        ];

        let insight = `You are ${level.toLowerCase()} on your ${examTarget} preparation. Keep pushing forward!`;
        try {
            const raw = await callGroq(messages);
            if (raw && raw.trim().length > 5) insight = raw.trim().replace(/^["']|["']$/g, '');
        } catch { /* use default insight */ }

        const readinessPayload = {
            score: totalScore,
            level,
            color,
            insight,
            breakdown,
            examTarget,
        };
        await logAIActivity(req, 'Readiness Score', `Calculated readiness score for ${examTarget} (Result: ${totalScore}%)`, readinessPayload);
        res.json({
            success: true,
            score: totalScore,
            level,
            color,
            insight,
            breakdown,
            examTarget,
        });
    } catch (err) {
        console.error('Readiness score error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to calculate readiness score.' });
    }
};

// ─── Feature 7: AI History Retrieval ──────────────────────────────────────────
// GET /api/student/ai/history
exports.getAIHistory = async (req, res) => {
    try {
        const { toolName } = req.query;
        if (!toolName) {
            return res.status(400).json({ success: false, message: 'toolName parameter is required.' });
        }
        const history = await AIActivityLog.find({
            student: req.user.id,
            toolName
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

        res.json({ success: true, history });
    } catch (err) {
        console.error('Get AI history error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch history.' });
    }
};
