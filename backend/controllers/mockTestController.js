const https = require('https');
const User = require('../models/User');
const MockTestAttempt = require('../models/MockTestAttempt');

// Groq OpenAI-compatible API
const GROQ_HOST = 'api.groq.com';
const GROQ_PATH = '/openai/v1/chat/completions';
// Models tried in order — if one is rate-limited or unavailable, the next is used
const GROQ_MODELS = [
    'llama3-8b-8192',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'gemma-7b-it',
];

// Detailed Exam Patterns with Sections, Syllabus, and Marking Scheme
const EXAM_PATTERNS = {
    'ssc_cgl': {
        name: 'SSC CGL',
        type: 'Staff Selection Commission - Combined Graduate Level',
        desc: 'Tier-1 CBT pattern. Evaluates quantitative, reasoning, english, and general awareness.',
        duration: 60,
        positive: 2,
        negative: 0.5,
        totalQuestions: 100, // actual exam total
        sections: [
            { id: 'reasoning', name: 'General Intelligence & Reasoning', weight: 25, topics: 'Analogy, Series, Coding-Decoding, Blood Relations, Venn Diagrams, Syllogism' },
            { id: 'ga', name: 'General Awareness', weight: 25, topics: 'History, Geography, Polity, Economy, Science, Sports, Current Affairs' },
            { id: 'quant', name: 'Quantitative Aptitude', weight: 25, topics: 'Percentage, Profit-Loss, SI/CI, Time-Work, Geometry, Algebra, Mensuration' },
            { id: 'english', name: 'English Comprehension', weight: 25, topics: 'Error Detection, Idioms, Synonyms, Antonyms, Sentence Improvement, Cloze Test' }
        ]
    },
    'ssc_chsl': {
        name: 'SSC CHSL',
        type: 'Staff Selection Commission - 10+2',
        desc: 'Tier-1 CBT pattern for LDC/JSA and DEO posts.',
        duration: 60,
        positive: 2,
        negative: 0.5,
        totalQuestions: 100,
        sections: [
            { id: 'english', name: 'English Language', weight: 25, topics: 'Spot the Error, Fill in the Blanks, Synonyms/Antonyms, Spellings, Idioms & Phrases' },
            { id: 'reasoning', name: 'General Intelligence', weight: 25, topics: 'Semantic/Symbolic/Figural Analogy & Classification, Number Series' },
            { id: 'quant', name: 'Quantitative Aptitude', weight: 25, topics: 'Arithmetic, Algebra, Geometry, Mensuration, Trigonometry, Statistical Charts' },
            { id: 'ga', name: 'General Awareness', weight: 25, topics: 'History, Culture, Geography, Economic Scene, Politics, Scientific Research' }
        ]
    },
    'ssc_gd': {
        name: 'SSC GD Constable',
        type: 'Staff Selection Commission',
        desc: 'CBT pattern for Central Armed Police Forces.',
        duration: 60,
        positive: 1,
        negative: 0.25,
        totalQuestions: 80,
        sections: [
            { id: 'reasoning', name: 'General Intelligence & Reasoning', weight: 20, topics: 'Analogies, Spatial Visualization, Visual Memory, Discrimination, Coding-Decoding' },
            { id: 'ga', name: 'General Knowledge & Awareness', weight: 20, topics: 'Sports, History, Culture, Geography, Economic Scene, General Polity, Indian Constitution' },
            { id: 'math', name: 'Elementary Mathematics', weight: 20, topics: 'Number Systems, Decimals, Fractions, Percentages, Ratio, Averages, Interest, Profit-Loss' },
            { id: 'lang', name: 'English/Hindi Selection', weight: 20, topics: 'Basic Language Comprehension, Grammar, Vocabulary' }
        ]
    },
    'upsc_cse': {
        name: 'UPSC CSE Prelims',
        type: 'Union Public Service Commission',
        desc: 'Civil Services General Studies Paper-I.',
        duration: 120,
        positive: 2,
        negative: 0.66,
        totalQuestions: 100,
        sections: [
            { id: 'history', name: 'History of India', weight: 20, topics: 'Ancient, Medieval, Modern India & Indian National Movement' },
            { id: 'geography', name: 'Indian and World Geography', weight: 20, topics: 'Physical, Social, Economic Geography of India and the World' },
            { id: 'polity', name: 'Indian Polity & Governance', weight: 20, topics: 'Constitution, Political System, Panchayati Raj, Public Policy, Rights Issues' },
            { id: 'economy', name: 'Economic & Social Development', weight: 20, topics: 'Sustainable Development, Poverty, Inclusion, Demographics, Social Sector' },
            { id: 'general', name: 'Environment & General Science', weight: 20, topics: 'Biodiversity, Climate Change, General Science, Current Affairs' }
        ]
    },
    'ibps_po': {
        name: 'IBPS PO Prelims',
        type: 'Institute of Banking Personnel Selection',
        desc: 'Preliminary exam for Probationary Officers in Public Sector Banks.',
        duration: 60,
        positive: 1,
        negative: 0.25,
        totalQuestions: 100,
        sections: [
            { id: 'english', name: 'English Language', weight: 30, topics: 'Reading Comprehension, Cloze Test, Para jumbles, Spotting Error, Fill in the blanks' },
            { id: 'quant', name: 'Quantitative Aptitude', weight: 35, topics: 'Data Interpretation, Number Series, Quadratic Equation, Approximation, Arithmetic' },
            { id: 'reasoning', name: 'Reasoning Ability', weight: 35, topics: 'Puzzles, Seating Arrangement, Syllogism, Inequality, Coding-Decoding, Blood Relation' }
        ]
    },
    'jee_main': {
        name: 'JEE Main Paper-1',
        type: 'National Testing Agency',
        desc: 'Joint Entrance Examination for B.E./B.Tech courses.',
        duration: 180,
        positive: 4,
        negative: 1,
        totalQuestions: 90,
        sections: [
            { id: 'physics', name: 'Physics', weight: 30, topics: 'Kinematics, Laws of Motion, Work-Energy, Thermodynamics, Waves, Electrostatics, Optics' },
            { id: 'chemistry', name: 'Chemistry', weight: 30, topics: 'Physical, Organic, Inorganic Chemistry, Atomic Structure, Equilibrium' },
            { id: 'maths', name: 'Mathematics', weight: 30, topics: 'Calculus, Algebra, Coordinate Geometry, Vectors, 3D Geometry, Probability' }
        ]
    },
    'rrb_ntpc': {
        name: 'RRB NTPC CBT-1',
        type: 'Railway Recruitment Boards',
        desc: 'Non-Technical Popular Categories Stage 1.',
        duration: 90,
        positive: 1,
        negative: 0.33,
        totalQuestions: 100,
        sections: [
            { id: 'math', name: 'Mathematics', weight: 30, topics: 'Number System, Decimals, Fractions, LCM, HCF, Ratio, %' },
            { id: 'reasoning', name: 'General Intelligence', weight: 30, topics: 'Analogies, Completion of Number/Alphabetical Series, Coding' },
            { id: 'ga', name: 'General Awareness', weight: 40, topics: 'Current Events, Games & Sports, Indian Literature, Monuments' }
        ]
    },
    'generic': {
        name: 'General Mock Test',
        type: 'General Competitive Exam',
        desc: 'A simulated test covering core aptitude and knowledge sections.',
        duration: 60,
        positive: 1,
        negative: 0.25,
        totalQuestions: 100,
        sections: [
            { id: 'quant', name: 'Quant / Math', weight: 25, topics: 'Arithmetic, Algebra, Geometry, Basic Statistics' },
            { id: 'reasoning', name: 'Logical Reasoning', weight: 25, topics: 'Puzzles, Series, Blood Relations, Coding-Decoding' },
            { id: 'english', name: 'English / Verbal', weight: 25, topics: 'Grammar, Vocabulary, Reading Comprehension' },
            { id: 'gk', name: 'General Knowledge', weight: 25, topics: 'Current Affairs, History, Geography, Basic Science' }
        ]
    }
};

// Map sub-exams to parents if exact match not found (for those with same pattern like clerk/po)
const EXAM_ALIASES = {
    'ibps_clerk': 'ibps_po',
    'sbi_po': 'ibps_po',
    'sbi_clerk': 'ibps_po',
    'ssc_mts': 'ssc_gd',
    'ssc_cpo': 'ssc_cgl',
    'upsc_cds': 'upsc_cse',
    'rrb_gd': 'rrb_ntpc',
    'neet_ug': 'jee_main', // we can add specific later, map to generic science/math for now
};

// ─── Groq API Call ───────────────────────────────────────────────────
const FALLBACK_GROQ_KEYS = [
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
].filter(Boolean);

const getGroqKeys = () => {
    const keys = [];
    if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
    keys.push(...FALLBACK_GROQ_KEYS);
    return [...new Set(keys)];
};

let currentGroqKeyIndex = 0;

const callGroqSingle = (messages, apiKey, model) => {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 8000,
            response_format: { type: 'json_object' }
        });

        const options = {
            hostname: GROQ_HOST,
            path: GROQ_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(body),
            },
            timeout: 35000,
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                if (res.statusCode === 429) {
                    return reject(new Error('rate_limit'));
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        if (parsed.error.message && parsed.error.message.toLowerCase().includes('rate limit')) {
                            return reject(new Error('rate_limit'));
                        }
                        return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
                    }
                    const text = parsed?.choices?.[0]?.message?.content || '';
                    resolve(text);
                } catch { reject(new Error('Invalid Groq response')); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Groq request timeout')); });
        req.write(body);
        req.end();
    });
};

const callGroq = async (messages) => {
    const keys = getGroqKeys();
    if (keys.length === 0) throw new Error('No Groq API keys configured on server. Please add GROQ_API_KEY to environment variables.');

    let lastError = null;

    // Try every combination of key × model until one works
    for (let ki = 0; ki < keys.length; ki++) {
        const keyIndex = (currentGroqKeyIndex + ki) % keys.length;
        const apiKey = keys[keyIndex];

        for (const model of GROQ_MODELS) {
            try {
                const result = await callGroqSingle(messages, apiKey, model);
                currentGroqKeyIndex = keyIndex;
                console.log(`[Groq] Success with key[${keyIndex}] + model=${model}`);
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`[Groq] key[${keyIndex}] model=${model} failed: ${error.message}`);
                // If rate-limited on this key, move to next key immediately
                if (error.message === 'rate_limit') break;
            }
        }
    }

    throw lastError || new Error('All Groq API keys and models failed. Please try again later.');
};

// ─── Extract JSON from model response ────────────────────────────────
const extractJSON = (text) => {
    let cleanText = text;
    // Remove problem control characters
    cleanText = cleanText.replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F]+/g, ' ');

    try {
        // Find the outermost JSON object by finding the first '{' and the last '}'
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            let jsonStr = cleanText.substring(firstBrace, lastBrace + 1);

            // Fix unescaped internal double-quotes (e.g. "question": "What is "foo" ?")
            // This replaces any double quote that is NOT preceded by : ", [ ", or { "
            // AND is NOT followed by ", "], or "} with a single quote '
            jsonStr = jsonStr.replace(/(?<!([{[:,]\s*))"(?!(\s*[:,\]}]))/g, "'");

            // Fix missing commas between array string elements: "foo" "bar" -> "foo", "bar"
            jsonStr = jsonStr.replace(/"\s+"/g, '", "');
            // Fix broken quotes at the end of lines or before commas
            jsonStr = jsonStr.replace(/([^"])\s*,\s*$/gm, '$1",');
            // Fix trailing commas in objects and arrays
            jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

            try { return JSON.parse(jsonStr); } catch (e) { }
        }

        // Fallback to array if top-level was accidentally an array
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            let arrStr = cleanText.substring(firstBracket, lastBracket + 1);

            arrStr = arrStr.replace(/(?<!([{[:,]\s*))"(?!(\s*[:,\]}]))/g, "'");
            // Fix missing commas between array string elements: "foo" "bar" -> "foo", "bar"
            arrStr = arrStr.replace(/"\s+"/g, '", "');
            // Fix broken quotes at the end of lines or before commas
            arrStr = arrStr.replace(/([^"])\s*,\s*$/gm, '$1",');
            // Fix trailing commas in objects and arrays
            arrStr = arrStr.replace(/,\s*([}\]])/g, '$1');

            try { return JSON.parse(arrStr); } catch (e) { }
        }

        return JSON.parse(cleanText.trim());
    } catch (e) {
        // Last ditch effort: try just finding [ ... ] and { ... } and parsing it without quotes fix
        try {
            const firstBracket = cleanText.indexOf('[');
            const lastBracket = cleanText.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) return JSON.parse(cleanText.substring(firstBracket, lastBracket + 1));
        } catch (err) { }

        console.error('\n=== RAW AI STRING ===\n', text);
        console.error('=== CLEAN AI STRING ===\n', cleanText);
        console.error('Failed to parse JSON text. Error:', e.message);
        throw new Error('AI produced invalid JSON output');
    }
};

// ─── GET /api/student/mock-test/pattern/:examCode ────────────────────
const getExamPattern = async (req, res) => {
    try {
        const code = req.params.examCode;
        const patternKey = EXAM_PATTERNS[code] ? code : (EXAM_ALIASES[code] || 'generic');
        const pattern = EXAM_PATTERNS[patternKey];
        res.json({ success: true, pattern });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/student/mock-test/generate ────────────────────────────
const generateTest = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Reset Daily Credits Logic (00:00 IST)
        const currentDateIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
        if (user.mockTestCreditsResetDate !== currentDateIST) {
            user.mockTestCredits = 2;
            user.mockTestCreditsResetDate = currentDateIST;
        }

        if (user.mockTestCredits <= 0) {
            return res.status(403).json({ success: false, message: `Daily Mock Test limit reached (0/2). Resets tomorrow at midnight.` });
        }

        // NOTE: Credit is deducted ONLY after successful generation (see bottom of function).

        const { examCode, sectionId, mode = 'mcq', lang = 'en' } = req.body;

        const patternKey = EXAM_PATTERNS[examCode] ? examCode : (EXAM_ALIASES[examCode] || 'generic');
        const pattern = EXAM_PATTERNS[patternKey];

        const difficulty = 'hard';

        let targetSections = pattern.sections;
        let totalCount = pattern.totalQuestions || 100;

        if (sectionId && sectionId !== 'all') {
            targetSections = pattern.sections.filter(s => s.id === sectionId);
            const secWeight = targetSections[0]?.weight || 100;
            totalCount = Math.max(5, Math.floor(pattern.totalQuestions * (secWeight / 100)));
        }

        const langNote = lang === 'hi'
            ? 'Write ALL questions, options, explanations in Hindi language (Devanagari script).'
            : 'Write everything strictly in English.';

        // ─── Chunked Parallel Generation ──────────────────────────────
        // Each AI call is limited to CHUNK_SIZE questions to stay within token limits.
        // All chunks for a section are fired concurrently via Promise.allSettled.
        // This avoids JSON truncation that causes "AI failed to generate" errors.
        const CHUNK_SIZE = 5;

        /**
         * Build a focused prompt for a single chunk of `count` questions.
         */
        const buildPrompt = (s, count, chunkIndex, totalChunks) => {
            const uniqueHint = totalChunks > 1
                ? ` (Set ${chunkIndex + 1}/${totalChunks} — all ${count} questions MUST be completely different topics/concepts from other sets)`
                : '';

            if (mode === 'mcq') {
                return `Generate exactly ${count} unique ${difficulty}-difficulty MCQ questions.\nExam: ${pattern.name}\nSection: ${s.name}\nTopics to draw from: ${s.topics}${uniqueHint}\n\n${langNote}\n\nRespond with ONLY a raw JSON array — no markdown fences, no extra text.\nEach element must have:\n  "question": string (no newlines)\n  "options": array of exactly 4 strings (no newlines)\n  "correct": integer 0-3 (0=A 1=B 2=C 3=D)\n  "explanation": string (one sentence, no newlines)\n  "sectionId": "${s.id}"\n  "sectionName": "${s.name}"`;
            }
            return `Generate exactly ${count} unique ${difficulty}-difficulty short-answer questions.\nExam: ${pattern.name}\nSection: ${s.name}\nTopics to draw from: ${s.topics}${uniqueHint}\n\n${langNote}\n\nRespond with ONLY a raw JSON array — no markdown fences, no extra text.\nEach element must have:\n  "question": string\n  "hint": string\n  "modelAnswer": string\n  "keywords": array of 3-5 key terms\n  "sectionId": "${s.id}"\n  "sectionName": "${s.name}"`;
        };

        /**
         * Fetch and validate one chunk — returns a clean array or [] on failure.
         */
        const fetchChunk = async (s, count, chunkIndex, totalChunks) => {
            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert exam coach for Indian competitive exams. Always respond with ONLY a valid JSON array and nothing else.'
                },
                {
                    role: 'user',
                    content: buildPrompt(s, count, chunkIndex, totalChunks)
                }
            ];

            const raw = await callGroq(messages);
            const parsed = extractJSON(raw);

            // Accept top-level array or first array value inside an object
            let qs = Array.isArray(parsed)
                ? parsed
                : (Array.isArray(parsed[s.id])
                    ? parsed[s.id]
                    : Object.values(parsed).find(v => Array.isArray(v)) || []);

            // Validate required fields per mode — drop malformed entries
            if (mode === 'mcq') {
                qs = qs.filter(q =>
                    q &&
                    typeof q.question === 'string' && q.question.trim().length > 0 &&
                    Array.isArray(q.options) && q.options.length === 4 &&
                    typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
                );
            } else {
                qs = qs.filter(q =>
                    q &&
                    typeof q.question === 'string' && q.question.trim().length > 0 &&
                    typeof q.modelAnswer === 'string' && q.modelAnswer.trim().length > 0
                );
            }

            if (qs.length === 0) {
                console.warn('[MockTest] fetchChunk resulted in 0 questions after parsing. Raw output was:');
                console.warn(raw);
                console.warn('Parsed object was:', parsed);
            }

            return qs;
        };

        let flatQuestions = [];
        let globalQIndex = 1;

        // Sections run sequentially to avoid hammering the API;
        // within each section, all chunk calls fire concurrently.
        for (const s of targetSections) {
            const secCount = sectionId === 'all'
                ? Math.floor((s.weight / 100) * totalCount)
                : totalCount;

            const targetCount = Math.max(CHUNK_SIZE, secCount);
            const totalChunks = Math.ceil(targetCount / CHUNK_SIZE);

            // Build one promise per chunk — fire all at once for this section
            const chunkPromises = Array.from({ length: totalChunks }, (_, i) => {
                const remaining = targetCount - i * CHUNK_SIZE;
                const chunkSize = Math.min(CHUNK_SIZE, remaining);
                return fetchChunk(s, chunkSize, i, totalChunks);
            });

            // allSettled: partial failures won't discard the rest
            const chunkResults = await Promise.allSettled(chunkPromises);

            let sectionQuestions = [];
            chunkResults.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    sectionQuestions.push(...result.value);
                } else {
                    console.warn(`[MockTest] Section "${s.id}" chunk ${i + 1}/${totalChunks} failed: ${result.reason?.message}`);
                }
            });

            // De-duplicate by first 80 chars of question text
            const seen = new Set();
            sectionQuestions = sectionQuestions.filter(q => {
                const key = q.question.trim().toLowerCase().slice(0, 80);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // Trim to exact target if over-generated
            sectionQuestions = sectionQuestions.slice(0, targetCount);

            sectionQuestions.forEach(q => {
                flatQuestions.push({
                    ...q,
                    id: globalQIndex++,
                    sectionId: s.id,
                    sectionName: q.sectionName || s.name
                });
            });

            console.log(`[MockTest] Section "${s.id}": ${sectionQuestions.length}/${targetCount} Qs (${totalChunks} chunks, ${chunkResults.filter(r => r.status === 'fulfilled').length} succeeded)`);
        }

        if (flatQuestions.length === 0) {
            return res.status(500).json({ success: false, message: 'AI failed to generate any questions. Please try again.' });
        }

        // Deduct credit ONLY after questions are successfully generated
        // (so a failed generation doesn't waste the student's daily credit)
        user.mockTestCredits -= 1;
        await user.save({ validateBeforeSave: false });

        // Persist the attempt
        const attempt = await MockTestAttempt.create({
            user: user._id,
            examCode,
            patternName: pattern.name,
            status: 'generated',
            testData: flatQuestions
        });

        res.json({
            success: true,
            attemptId: attempt._id,
            questions: flatQuestions,
            newCredits: user.mockTestCredits,
            meta: { examCode, patternName: pattern.name, mode, difficulty, lang, total: flatQuestions.length }
        });
    } catch (err) {
        console.error('Generate error:', err.message);
        res.status(500).json({ success: false, message: `Failed to generate questions: ${err.message}` });
    }
};

// ─── POST /api/student/mock-test/evaluate ────────────────────────────
// Evaluate unchanged mapping to sections
const evaluateTest = async (req, res) => {
    try {
        const { answers, lang = 'en' } = req.body;
        if (!answers || !answers.length) return res.status(400).json({ success: false, message: 'No answers provided' });

        const langNote = lang === 'hi' ? 'Respond entirely in Hindi.' : 'Respond in English.';
        const formatted = answers.map((a, i) =>
            `Q${i + 1}: ${a.question}\nModel Answer: ${a.modelAnswer}\nKey Terms: ${(a.keywords || []).join(', ')}\nStudent Answer: ${a.studentAnswer || '(blank)'}`
        ).join('\n\n---\n\n');

        const messages = [
            {
                role: 'system',
                content: `You are a strict evaluator for Indian competitive exams. ${langNote} Evaluate each student answer and return ONLY a JSON array. Each object: { "id": number, "score": 0-5 integer, "feedback": 1 sentence, "correct": boolean }`,
            },
            { role: 'user', content: `Evaluate these ${answers.length} answers:\n\n${formatted}` },
        ];

        const raw = await callGroq(messages);
        const evaluation = extractJSON(raw);
        const totalScore = evaluation.reduce((sum, e) => sum + (e.score || 0), 0);
        const maxScore = answers.length * 5;
        const percentage = Math.round((totalScore / maxScore) * 100);
        const grade = percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'D';

        res.json({
            success: true,
            evaluation,
            summary: {
                totalScore, maxScore, percentage, grade,
                message: percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : percentage >= 40 ? 'Keep Practicing!' : 'Needs More Effort',
            },
        });
    } catch (err) {
        console.error('Evaluate error:', err.message);
        res.status(500).json({ success: false, message: `Failed to evaluate answers: ${err.message}` });
    }
};

// ─── POST /api/student/mock-test/submit/:attemptId ───────────────────
const submitTest = async (req, res) => {
    try {
        const attemptId = req.params.attemptId;
        const { results, timeLeft, maxTime, isCheating } = req.body;

        const attempt = await MockTestAttempt.findOne({ _id: attemptId, user: req.user.id });
        if (!attempt) return res.status(404).json({ success: false, message: 'Test attempt not found' });
        if (attempt.status === 'completed') return res.status(400).json({ success: false, message: 'Test already submitted' });

        // Evaluate MCQs and calculate score
        let score = 0;
        let totalMax = 0;
        
        // Use pattern info
        let positiveMarks = 1;
        let negativeMarks = 0;
        const examCode = attempt.examCode;
        if (EXAM_PATTERNS[examCode] || EXAM_PATTERNS[EXAM_ALIASES[examCode]]) {
            const p = EXAM_PATTERNS[examCode] || EXAM_PATTERNS[EXAM_ALIASES[examCode]];
            positiveMarks = p.positive;
            negativeMarks = p.negative;
        }

        results.forEach(r => {
            totalMax += positiveMarks;
            if (r.selected !== null && r.selected !== undefined) {
                if (r.selected === r.correct) {
                    score += positiveMarks;
                } else {
                    score -= negativeMarks;
                }
            }
        });

        // Ensure score doesn't go below 0 (optional, but standard for some)
        // Leaving it precise (even negative) as some real exams allow negative totals.
        const percentage = Math.max(0, Math.round((score / totalMax) * 100));

        attempt.status = 'completed';
        attempt.completedAt = new Date();
        attempt.score = score;
        attempt.maxScore = totalMax;
        attempt.percentage = percentage;
        attempt.timeTaken = maxTime - timeLeft;
        attempt.isCheating = isCheating;
        attempt.testData = results;

        await attempt.save();

        res.json({ success: true, attempt });
    } catch (err) {
        console.error('Submit Test Error:', err);
        res.status(500).json({ success: false, message: 'Failed to submit test' });
    }
};

// ─── GET /api/student/mock-test/history ──────────────────────────────
const getMyMockTests = async (req, res) => {
    try {
        // Find tests for user, sort by newest first
        const history = await MockTestAttempt.find({ user: req.user.id })
            .sort({ startedAt: -1 });
            
        res.json({ success: true, history });
    } catch (err) {
        console.error('Fetch Mock Tests Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch mock test history' });
    }
};

// ─── GET /api/student/mock-test/credits ──────────────────────────────
// Lightweight endpoint: runs the daily reset logic and returns live credits.
// Called on page load so the header always shows the correct DB value.
const getCredits = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Run the same daily reset logic as generateTest
        const currentDateIST = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
        });
        if (user.mockTestCreditsResetDate !== currentDateIST) {
            user.mockTestCredits = 2;
            user.mockTestCreditsResetDate = currentDateIST;
            await user.save({ validateBeforeSave: false });
        }

        res.json({ success: true, credits: user.mockTestCredits, maxCredits: 2 });
    } catch (err) {
        console.error('getCredits error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch credits' });
    }
};

module.exports = { getExamPattern, generateTest, evaluateTest, submitTest, getMyMockTests, getCredits };

