const https = require('https');
const User = require('../models/User');
const DoubtSession = require('../models/DoubtSession');

const GROQ_HOST = 'api.groq.com';
const GROQ_PATH = '/openai/v1/chat/completions';
const GROQ_MODELS = [
    'groq/compound',          // Built-in web retrieval for current affairs
    'openai/gpt-oss-20b',     // GPT OSS 20B fallback
    'openai/gpt-oss-120b',    // GPT OSS 120B fallback
    'qwen/qwen3.8-27b',       // Qwen 3.8 fallback
    'qwen/qwen3.6-27b',       // Qwen 3.6 fallback
    'allam-2-7b',             // Lightweight last fallback
];

const DAILY_DOUBT_LIMIT = 10;

// ── Groq call (with multi-key and multi-model fallback) ──
const callGroq = async (messages) => {
    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_2,
        process.env.GROQ_API_KEY_3,
    ].filter(Boolean);
    if (keys.length === 0) throw new Error('No Groq API key configured');

    let lastError = null;
    for (let ki = 0; ki < keys.length; ki++) {
        const apiKey = keys[ki];
        for (const model of GROQ_MODELS) {
            try {
                const text = await new Promise((resolve, reject) => {
                    const body = JSON.stringify({
                        model,
                        messages,
                        temperature: 0.6,
                        max_tokens: 2000,
                    });
                    const req = https.request({
                        hostname: GROQ_HOST,
                        path: GROQ_PATH,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Length': Buffer.byteLength(body),
                        },
                        timeout: 30000,
                    }, (res) => {
                        let data = '';
                        res.on('data', c => (data += c));
                        res.on('end', () => {
                            if (res.statusCode === 429) return reject(new Error('rate_limit'));
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.error) return reject(new Error(parsed.error.message || 'Groq error'));
                                resolve(parsed?.choices?.[0]?.message?.content || '');
                            } catch (e) { reject(new Error('Invalid response')); }
                        });
                    });
                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
                    req.write(body);
                    req.end();
                });
                if (text) return text;
            } catch (err) {
                lastError = err;
                console.warn(`[Groq Doubt] key[${ki}] model=${model} failed: ${err.message}`);
                if (err.message === 'rate_limit') break;
            }
        }
    }
    throw lastError || new Error('All Groq keys and models failed');
};

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
        const student = await User.findById(studentId).select('doubtCredits maxDoubtCredits doubtCreditsResetDate');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const todayIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

        const maxLimit = Math.max(student.maxDoubtCredits || 0, student.doubtCredits || 0, 10);

        if (student.doubtCreditsResetDate !== todayIST) {
            student.doubtCredits = maxLimit;
            student.maxDoubtCredits = maxLimit;
            student.doubtCreditsResetDate = todayIST;
        } else if (student.doubtCredits > maxLimit) {
            student.doubtCredits = maxLimit;
        }

        if (student.doubtCredits <= 0) {
            return res.status(429).json({
                success: false,
                message: `Credit limit reached (${maxLimit} questions). Come back tomorrow!`,
                creditsLeft: 0,
                maxCredits: maxLimit
            });
        }

        // Deduct before calling API
        student.doubtCredits = Math.max(0, student.doubtCredits - 1);
        if (!student.maxDoubtCredits || student.maxDoubtCredits < maxLimit) {
            student.maxDoubtCredits = maxLimit;
        }
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
CRITICAL FORMATTING RULES FOR MAXIMUM READABILITY:
- Structure your response using clear markdown headings (##), numbered steps, and bullet points.
- When explaining formulas, equations, or chemical reactions, write them in standard LaTeX math notation:
  - Block equations: $$ [equation] $$ or \\[ [equation] \\]
  - Inline formulas: $ [formula] $
  - NEVER wrap LaTeX formulas or equations in backticks (\`...\`). Write them directly as $ [formula] $ or $$ [equation] $$.
- When comparing concepts or presenting structured data, use clean Markdown tables (| Col 1 | Col 2 |).
- Never write dense, unbroken blocks of text. Keep paragraphs short (2-3 sentences max).
- Always organize into these clean, visually distinct sections:

## Direct Answer
[1-2 crisp sentences giving the exact answer clearly]

## Step-by-Step Breakdown
1. [First key step or concept with **bold** highlights]
2. [Second mechanism, proof, or formula]
3. [Third practical application or detail]

## Key Points to Remember
- [Crucial takeaway or fact 1]
- [Crucial takeaway or fact 2]
- [Crucial takeaway or fact 3]

> 🎯 Key Tip / Formula: [One practical tip or memory trick for exams]

Keep total response under 500 words. For current affairs, use your web retrieval capability to provide accurate and up-to-date information.`
            },
            { role: 'user', content: question.trim() }
        ];

        const answer = await callGroq(messages);

        res.json({
            success: true,
            answer: answer.trim(),
            subject,
            creditsLeft: Math.max(0, student.doubtCredits),
            maxCredits: student.maxDoubtCredits || maxLimit,
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
        const { showInactive } = req.query;
        const counts = await DoubtSession.aggregate([
            { $group: { _id: '$student', sessionCount: { $sum: 1 }, lastActive: { $max: '$lastActive' } } },
            { $sort: { lastActive: -1 } },
        ]);
        const studentIds = counts.map(c => c._id);
        
        const userQuery = { _id: { $in: studentIds } };
        if (showInactive !== 'true') {
            userQuery.isActive = true;
        }

        const students = await User.find(userQuery).select('name studentId email isActive').lean();
        const sMap = {}; students.forEach(s => { sMap[s._id.toString()] = s; });
        const result = counts.map(c => {
            const studentInfo = sMap[c._id.toString()];
            if (!studentInfo) return null;
            return {
                ...studentInfo,
                sessionCount: c.sessionCount,
                lastActive: c.lastActive,
            };
        }).filter(x => x && x.name);
        res.json({ success: true, students: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/chat-history/:studentId/:sessionId — delete one session
exports.deleteStudentSession = async (req, res) => {
    try {
        const { studentId, sessionId } = req.params;
        await DoubtSession.findOneAndDelete({ student: studentId, sessionId });
        res.json({ success: true, message: 'Session deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/chat-history/:studentId/all — delete all sessions for a student
exports.deleteAllStudentSessions = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await DoubtSession.deleteMany({ student: studentId });
        res.json({ success: true, message: `Deleted ${result.deletedCount} sessions` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

