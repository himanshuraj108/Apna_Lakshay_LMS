const https = require('https');
const User = require('../models/User');
const DoubtSession = require('../models/DoubtSession');

const GROQ_HOST = 'api.groq.com';
const GROQ_PATH = '/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const DAILY_DOUBT_LIMIT = 10;

// ── Groq call (reuse same pattern as mockTestController) ──
const callGroq = (messages) => new Promise((resolve, reject) => {
    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_2,
        process.env.GROQ_API_KEY_3,
    ].filter(Boolean);
    if (keys.length === 0) return reject(new Error('No Groq API key configured'));

    const tryKey = (idx) => {
        if (idx >= keys.length) return reject(new Error('All Groq keys failed'));
        const body = JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: 0.6,
            max_tokens: 1200,
        });
        const req = https.request({
            hostname: GROQ_HOST,
            path: GROQ_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${keys[idx]}`,
                'Content-Length': Buffer.byteLength(body),
            },
            timeout: 30000,
        }, (res) => {
            let data = '';
            res.on('data', c => (data += c));
            res.on('end', () => {
                if (res.statusCode === 429) return tryKey(idx + 1);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return tryKey(idx + 1);
                    resolve(parsed?.choices?.[0]?.message?.content || '');
                } catch { tryKey(idx + 1); }
            });
        });
        req.on('error', () => tryKey(idx + 1));
        req.on('timeout', () => { req.destroy(); tryKey(idx + 1); });
        req.write(body);
        req.end();
    };
    tryKey(0);
});

const SUBJECT_CONTEXT = {
    maths:          'You are a brilliant Maths tutor for Indian competitive exams (SSC, UPSC, Banking).',
    science:        'You are a Science teacher for Indian competitive exams, covering Physics, Chemistry, Biology.',
    history:        'You are a History expert specializing in Indian and World History for competitive exams.',
    polity:         'You are a Polity and Constitution expert for UPSC and SSC exams.',
    economy:        'You are an Economics tutor for Indian competitive exams covering Micro, Macro, Indian Economy.',
    geography:      'You are a Geography expert for Indian competitive exams (India and World Geography).',
    current_affairs:'You are a Current Affairs analyst specializing in Indian national and international news.',
    english:        'You are an English language expert for Indian competitive exams.',
    general:        'You are a knowledgeable tutor helping Indian competitive exam students.',
};

// POST /api/student/doubt/ask
exports.askDoubt = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { question, subject = 'general', lang = 'en' } = req.body;

        if (!question || question.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Please enter a valid question.' });
        }
        if (question.length > 1000) {
            return res.status(400).json({ success: false, message: 'Question too long (max 1000 characters).' });
        }

        // ── Rate limit check ──
        const student = await User.findById(studentId).select('doubtCredits doubtCreditsResetDate');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const todayIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

        if (student.doubtCreditsResetDate !== todayIST) {
            student.doubtCredits = DAILY_DOUBT_LIMIT;
            student.doubtCreditsResetDate = todayIST;
        }

        if (student.doubtCredits <= 0) {
            return res.status(429).json({
                success: false,
                message: `Daily limit reached (${DAILY_DOUBT_LIMIT} questions/day). Come back tomorrow!`,
                creditsLeft: 0
            });
        }

        // Deduct before calling API
        student.doubtCredits -= 1;
        await student.save({ validateBeforeSave: false });

        const systemPrompt = SUBJECT_CONTEXT[subject] || SUBJECT_CONTEXT.general;

        let langInstruction;
        if (lang === 'hi') {
            langInstruction = `CRITICAL LANGUAGE RULE: You MUST respond ENTIRELY in Hindi using Devanagari script (हिंदी). 
- Do NOT use any English words or Roman script at all — not even for technical terms (use their Hindi equivalents or transliterations in Devanagari).
- Every single word must be written in Devanagari script.
- Section headings must also be in Hindi Devanagari.
- If you don't know the Hindi word, write it in Devanagari phonetically.`;
        } else if (lang === 'hinglish') {
            langInstruction = `LANGUAGE RULE: Respond in Hinglish — a friendly mix of Hindi and English written in Roman script (NOT Devanagari). 
- Write naturally like a friend explaining concepts, e.g. "Yaar, is topic mein basically..."
- You can mix English and Hindi words freely but write everything in Roman letters.
- Keep it casual, simple, and easy to understand.
- Section headings can be in English.`;
        } else {
            langInstruction = 'Respond clearly in English.';
        }

        const messages = [
            {
                role: 'system',
                content: `${systemPrompt}
${langInstruction}
Answer the student's question clearly and concisely. Format your response as:
1. **Direct Answer** — give the answer in 1-3 sentences
2. **Explanation** — explain in simple language (3-5 sentences)
3. **Key Points** — 2-4 bullet points of important facts to remember
4. **Exam Tip** — one practical tip for the exam

Keep the total response under 300 words. If unsure, say so honestly.`
            },
            { role: 'user', content: question.trim() }
        ];

        const answer = await callGroq(messages);

        res.json({
            success: true,
            answer: answer.trim(),
            subject,
            creditsLeft: student.doubtCredits,
            question: question.trim()
        });

    } catch (err) {
        console.error('Doubt error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to get answer. Please try again.' });
    }
};

// POST /api/student/doubt/sync-session  — called by frontend to persist sessions
exports.syncDoubtSession = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { sessionId, title, lang, pinned, messages } = req.body;
        if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });
        await DoubtSession.findOneAndUpdate(
            { student: studentId, sessionId },
            { title: title || 'Untitled', lang: lang || 'en', pinned: !!pinned, messages: messages || [], lastActive: new Date() },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/chat-history/:studentId  — admin views a student's sessions
exports.getStudentChatHistory = async (req, res) => {
    try {
        const { studentId } = req.params;
        const sessions = await DoubtSession.find({ student: studentId })
            .sort({ lastActive: -1 })
            .lean();
        const student = await User.findById(studentId).select('name studentId email').lean();
        res.json({ success: true, student, sessions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/chat-history (list all students with session counts)
exports.getStudentsWithChatHistory = async (req, res) => {
    try {
        const counts = await DoubtSession.aggregate([
            { $group: { _id: '$student', sessionCount: { $sum: 1 }, lastActive: { $max: '$lastActive' } } },
            { $sort: { lastActive: -1 } },
        ]);
        const studentIds = counts.map(c => c._id);
        const students = await User.find({ _id: { $in: studentIds } }).select('name studentId email').lean();
        const sMap = {}; students.forEach(s => { sMap[s._id.toString()] = s; });
        const result = counts.map(c => ({
            ...sMap[c._id.toString()],
            sessionCount: c.sessionCount,
            lastActive: c.lastActive,
        })).filter(x => x.name);
        res.json({ success: true, students: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
