const https = require('https');
const User = require('../models/User');

// Groq OpenAI-compatible API
const GROQ_HOST = 'api.groq.com';
const GROQ_PATH = '/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant'; // Free, fast, great for structured output

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
const callGroq = (messages) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GROQ_API_KEY;
        const body = JSON.stringify({
            model: GROQ_MODEL,
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
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
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
            user.mockTestCredits = 3;
            user.mockTestCreditsResetDate = currentDateIST;
        }

        if (user.mockTestCredits <= 0) {
            return res.status(403).json({ success: false, message: 'Daily Mock Test limit reached (0/3). Please try again tomorrow.' });
        }

        // Deduct Credit BEFORE generating to prevent race conditions
        user.mockTestCredits -= 1;
        await user.save({ validateBeforeSave: false });

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

        let flatQuestions = [];
        let globalQIndex = 1;

        // Generate section by section to avoid token truncation & ensure strict counts
        for (const s of targetSections) {
            const secCount = sectionId === 'all'
                ? Math.floor((s.weight / 100) * totalCount)
                : totalCount;

            const targetCount = Math.max(1, secCount);

            const modePrompt = mode === 'mcq'
                ? `Generate exactly ${targetCount} high-quality ${difficulty}-difficulty MCQ questions for Section: ${s.name} regarding topics: ${s.topics}.
These must match real ${pattern.name} exam standards.

${langNote}

Return ONLY a JSON array of question objects.
Each question object MUST have:
- "question": string (NO newlines inside string)
- "options": array of exactly 4 strings (NO newlines inside string)
- "correct": number (0-indexed, 0=A, 1=B, 2=C, 3=D)
- "explanation": string (brief explanation, NO newlines inside string)
- "sectionId": "${s.id}"
- "sectionName": "${s.name}"`
                : `Generate exactly ${targetCount} ${difficulty}-difficulty short-answer questions for Section: ${s.name} regarding topics: ${s.topics}.
Match ${pattern.name} exam standards.

${langNote}

Return ONLY a JSON array of question objects.
Each question object MUST have:
- "question": string
- "hint": string
- "modelAnswer": string
- "keywords": array of 3-5 key terms
- "sectionId": "${s.id}"
- "sectionName": "${s.name}"`;

            const messages = [
                { role: 'system', content: `You are an expert exam coach for Indian competitive exams. You MUST respond with ONLY a valid JSON array. NO text before or after the JSON.` },
                { role: 'user', content: modePrompt },
            ];

            try {
                const raw = await callGroq(messages);
                const sectionData = extractJSON(raw);

                // sectionData should be an array directly based on the new prompt
                let qs = Array.isArray(sectionData) ? sectionData : (sectionData[s.id] || Object.values(sectionData)[0] || []);

                if (Array.isArray(qs)) {
                    qs.forEach(q => {
                        flatQuestions.push({
                            ...q,
                            id: globalQIndex++,
                            sectionId: s.id,
                            sectionName: q.sectionName || s.name
                        });
                    });
                }
            } catch (secErr) {
                console.error(`Failed to generate section ${s.id}:`, secErr.message);
                // Continue to try to generate other sections even if one fails
            }
        }

        if (flatQuestions.length === 0) {
            return res.status(500).json({ success: false, message: 'AI failed to generate any questions.' });
        }

        res.json({
            success: true,
            questions: flatQuestions,
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
                message: percentage >= 80 ? 'Excellent! 🏆' : percentage >= 60 ? 'Good Job! 👍' : percentage >= 40 ? 'Keep Practicing! 📚' : 'Needs More Effort 💪',
            },
        });
    } catch (err) {
        console.error('Evaluate error:', err.message);
        res.status(500).json({ success: false, message: `Failed to evaluate answers: ${err.message}` });
    }
};

module.exports = { getExamPattern, generateTest, evaluateTest };
