const https = require('https');
const User = require('../models/User');
const DoubtSession = require('../models/DoubtSession');

const GROQ_HOST = 'api.groq.com';
const GROQ_PATH = '/openai/v1/chat/completions';
const GROQ_MODELS = [
    'openai/gpt-oss-120b',      // Best quality, fast (tested 200 OK)
    'openai/gpt-oss-20b',       // Fast fallback
    'qwen/qwen3.8-27b',         // High-grade math & reasoning
    'qwen/qwen3.6-27b',         // Fast fallback
    'allam-2-7b',               // Lightweight fallback
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
    maths:          'You are a brilliant Maths tutor for Indian competitive exams (SSC, UPSC, Banking). Answer all maths questions clearly with steps.',
    science:        'You are a Science teacher for Indian competitive exams, covering Physics, Chemistry, Biology.',
    history:        'You are a History expert specializing in Indian and World History for competitive exams.',
    polity:         'You are a Polity and Constitution expert for UPSC and SSC exams.',
    economy:        'You are an Economics tutor for Indian competitive exams covering Micro, Macro, Indian Economy.',
    geography:      'You are a Geography expert for Indian competitive exams (India and World Geography).',
    current_affairs:'You are a Current Affairs analyst specializing in Indian national and international news.',
    english:        'You are an English language expert for Indian competitive exams.',
    general:        'You are a friendly, helpful AI assistant like ChatGPT. You can talk about absolutely anything — greetings, casual chat, advice, studies, general knowledge, current events, coding, creativity, or any topic the user brings up. Be warm, natural, and conversational. If someone says "hi" or "hello", greet them back warmly. Never refuse to engage with any topic.',
};

// ── Auto-detect language from text ──────────────────────────────────────────
function detectLang(text) {
    // Devanagari Unicode block: U+0900–U+097F
    const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
    if (devanagariCount > 2) return 'hi';
    // Hinglish: mix of Hindi words written in Roman + English
    const hinglishPattern = /\b(kya|hai|hain|mein|ka|ki|ke|aur|nahi|yaar|bhai|kaise|karo|iska|uska|toh|par|lekin|matlab|samajh|batao|bolo|dekho|achha|theek|sahi|galat|hoga|hota|karta|karti|hoti|gaya|gayi|gaye|aaya|aayi|aaye|kuch|bhi|sab|mera|meri|mere|tera|teri|tere|hum|tum|aap)\b/i;
    if (hinglishPattern.test(text)) return 'hinglish';
    return 'en';
}

// POST /api/student/doubt/ask
exports.askDoubt = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { question, subject = 'general', lang = 'en' } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ success: false, message: 'Please type something.' });
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

        // ── Auto-detect language from question ──
        const autoLang = detectLang(question.trim());
        const effectiveLang = autoLang !== 'en' ? autoLang : (lang || 'en');

        const systemPrompt = SUBJECT_CONTEXT[subject] || SUBJECT_CONTEXT.general;

        let langInstruction;
        if (effectiveLang === 'hi') {
            langInstruction = `CRITICAL LANGUAGE RULE: You MUST respond in clean, natural Hindi using Devanagari script (हिंदी). For scientific/mathematical formulas, keep standard math notation ($F = ma$, $\\text{H}_2\\text{O}$) while explaining in Hindi.`;
        } else if (effectiveLang === 'hinglish') {
            langInstruction = `LANGUAGE RULE: Respond in friendly, natural Hinglish (Hindi written in Roman/English alphabet). Explain concepts clearly and simply like a top tutor. Mathematical formulas must remain in standard LaTeX notation ($...$).`;
        } else {
            langInstruction = 'Respond clearly and concisely in English. Use standard LaTeX for formulas.';
        }

        // Detect if this is a casual greeting / smalltalk
        const trimmedQ = question.trim().toLowerCase();
        const isGreeting = /^(hi|hello|hii|hey|helo|hlo|namaste|pranam|good\s*(morning|evening|night|afternoon)|how are you|kya haal|kaise ho|sup|whatsup|bye|thanks|thank you|ok|okay|theek hai|sahi hai|great|cool|lol|haha)[!.,?\s]*$/i.test(trimmedQ);
        const isCasual = isGreeting || (trimmedQ.length < 15 && /^(hi|hello|hii|hey|namaste|kaise ho)/i.test(trimmedQ));

        const formattingInstruction = isCasual
            ? `RULES FOR CASUAL CONVERSATION:
- Jump DIRECTLY into your response. Do NOT repeat or re-phrase the user's greeting.
- Do NOT say "ask: ..." or "My response:".
- Do NOT use emojis.
- Greet back warmly and politely like a top tutor. For example: "Hello! How can I help you with your studies or any questions today?"
- Keep it short, natural, and friendly (1-2 sentences).`
            : `RULES FOR QUESTIONS & DOUBTS:
- Jump DIRECTLY into the answer. Never say "Sure, here is...", "ask: ...", or "My response:".
- Do NOT use emojis.
- Structure your response using clear Markdown:

## Direct Answer
[1-2 clear, direct sentences answering the question]

## Step-by-Step Explanation
[Clear, well-explained steps or concepts with **bold** key terms. Use numbered steps for derivations or calculations.]

## Key Formulas & Equations (if applicable)
- Write all standalone equations in centered display LaTeX math:
$$
[formula]
$$
- Write inline variables using single dollar signs: $x$, $y$, $F = ma$.
- NEVER put LaTeX formulas inside code backticks (\`...\`).
- Clearly explain what each variable represents.

## Key Points
- [Key takeaway 1]
- [Key takeaway 2]

Keep total response well-organized, accurate, and easy to read.`;

        const messages = [
            {
                role: 'system',
                content: `${systemPrompt}\n${langInstruction}\n${formattingInstruction}`
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

// POST /api/student/doubt/ask-stream  — Server-Sent Events streaming version
exports.askDoubtStream = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { question, subject = 'general', lang = 'en' } = req.body;

        if (!question || question.trim().length < 1) {
            return res.status(400).json({ success: false, message: 'Please enter a message.' });
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
                creditsLeft: 0, maxCredits: maxLimit
            });
        }

        student.doubtCredits = Math.max(0, student.doubtCredits - 1);
        if (!student.maxDoubtCredits || student.maxDoubtCredits < maxLimit) student.maxDoubtCredits = maxLimit;
        await student.save({ validateBeforeSave: false });

        // ── Auto-detect language from what user typed ──
        const autoLang = detectLang(question.trim());
        const effectiveLang = autoLang !== 'en' ? autoLang : lang; // prefer detected lang

        const systemPrompt = SUBJECT_CONTEXT[subject] || SUBJECT_CONTEXT.general;

        let langInstruction;
        if (effectiveLang === 'hi') {
            langInstruction = `CRITICAL LANGUAGE RULE: You MUST respond ENTIRELY in Hindi using Devanagari script (हिंदी). Every single word must be written in Devanagari script.`;
        } else if (effectiveLang === 'hinglish') {
            langInstruction = `LANGUAGE RULE: Respond in Hinglish — a friendly mix of Hindi and English in Roman script. Natural, casual tone like a friend. E.g. "Yaar, is topic mein basically..."`;
        } else {
            langInstruction = 'Respond clearly in English.';
        }

        const trimmedQ = question.trim().toLowerCase();
        const isCasual = trimmedQ.length < 20
            || /^(hi|hello|hii|hey|helo|hlo|namaste|good\s*(morning|evening|night|afternoon)|how are you|kya haal|kaise ho|sup|whatsup|bye|thanks|thank you|ok|okay|great|nice|cool|lol|haha)/.test(trimmedQ)
            || subject === 'general';

        const formattingInstruction = isCasual
            ? `Respond naturally and conversationally like a friendly AI assistant (ChatGPT style). For greetings respond warmly. Short, warm, human responses are perfect.`
            : `Structure your response with markdown (## headings, numbered steps, bullet points). Use LaTeX for math: $formula$ inline, $$formula$$ for blocks. Keep under 500 words.`;

        const messages = [
            { role: 'system', content: `${systemPrompt}\n${langInstruction}\n${formattingInstruction}` },
            { role: 'user', content: question.trim() }
        ];

        // ── SSE headers ──
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
        res.flushHeaders();

        // Send metadata first
        res.write(`data: ${JSON.stringify({ type: 'meta', creditsLeft: Math.max(0, student.doubtCredits), maxCredits: student.maxDoubtCredits || maxLimit })}\n\n`);

        // ── Stream from Groq ──
        const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean);
        if (keys.length === 0) { res.write(`data: ${JSON.stringify({ type: 'error', message: 'No API key' })}\n\n`); return res.end(); }

        let streamed = false;
        for (const apiKey of keys) {
            for (const model of GROQ_MODELS) {
                try {
                    await new Promise((resolve, reject) => {
                        const body = JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2000, stream: true });
                        const request = https.request({
                            hostname: GROQ_HOST,
                            path: GROQ_PATH,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Length': Buffer.byteLength(body),
                            },
                            timeout: 30000,
                        }, (groqRes) => {
                            if (groqRes.statusCode === 429) return reject(new Error('rate_limit'));
                            let buffer = '';
                            groqRes.on('data', (chunk) => {
                                buffer += chunk.toString();
                                const lines = buffer.split('\n');
                                buffer = lines.pop(); // keep incomplete line
                                for (const line of lines) {
                                    const trimmed = line.trim();
                                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                                    if (trimmed.startsWith('data: ')) {
                                        try {
                                            const parsed = JSON.parse(trimmed.slice(6));
                                            const token = parsed?.choices?.[0]?.delta?.content;
                                            if (token) {
                                                res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
                                                streamed = true;
                                            }
                                        } catch (_) {}
                                    }
                                }
                            });
                            groqRes.on('end', () => resolve());
                            groqRes.on('error', reject);
                        });
                        request.on('error', reject);
                        request.on('timeout', () => { request.destroy(); reject(new Error('timeout')); });
                        request.write(body);
                        request.end();
                    });
                    if (streamed) {
                        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                        return res.end();
                    }
                } catch (err) {
                    console.warn(`[Stream] key failed model=${model}: ${err.message}`);
                    if (err.message === 'rate_limit') break;
                }
            }
        }
        if (!streamed) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to get response. Please try again.' })}\n\n`);
            res.end();
        }

    } catch (err) {
        console.error('Stream doubt error:', err.message);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to get answer.' });
        else { res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`); res.end(); }
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

