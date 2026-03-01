const https = require('https');

const GROQ_HOST = 'api.groq.com';
const GROQ_PATH = '/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const EXAM_TOPICS = {
    ssc_cgl: 'SSC CGL - Quantitative Aptitude (Percentage, Profit-Loss, SI/CI, Time-Work, Geometry, Algebra), English (Error Detection, Idioms, Synonyms/Antonyms, Sentence Improvement), General Intelligence & Reasoning (Analogy, Series, Coding-Decoding, Blood Relations, Venn Diagrams), General Awareness (History, Geography, Polity, Economy, Science, Sports)',
    ssc_chsl: 'SSC CHSL 10+2 - Basic Quantitative Aptitude (Arithmetic, Algebra, Geometry, Data Interpretation), English Language (Reading Comprehension, Cloze Test, Sentence Improvement, Active-Passive, Vocabulary), General Intelligence (Non-Verbal Reasoning, Logical Reasoning), General Awareness (Static GK, Science, Current Affairs)',
    ssc_gd: 'SSC GD Constable - Elementary Mathematics (Number System, LCM/HCF, Percentage, Simple Interest, Ratio, Time & Work), General Intelligence & Reasoning (Analogy, Odd One Out, Series, Coding, Direction Sense), General Knowledge & Awareness (Indian History, Freedom Struggle, Geography, Polity, Economics, Sports, Science), English/Hindi Language (Fill in blanks, Error Detection, Synonyms)',
    ssc_mts: 'SSC MTS - Numerical Aptitude (Basic Arithmetic, Percentage, Ratio, Fractions, Time & Work), Reasoning Ability (Analogy, Classification, Coding, Series, Direction Test), General English (Vocabulary, Grammar, Comprehension Passages), General Awareness (Daily Life Science, Polity, History, Geography)',
    ssc_cpo: 'SSC CPO SI/ASI - General Intelligence & Reasoning (Analogy, Symbolic Operations, Number Series, Logical Venn Diagrams, Data Sufficiency), General Knowledge & Awareness (India, World, Sports, Science & Technology, Current Affairs), Quantitative Aptitude (Number System, Data Interpretation, Percentages, Geometry), English Comprehension (Fill blanks, Reading Comprehension, Jumbled Sentences)',
    upsc_cse: 'UPSC Civil Services Prelims GS Paper-1 - Indian History & Culture (Ancient, Medieval, Modern, Art & Culture), Indian Geography (Physical, Economic, Resources), Indian Polity & Governance (Constitution, Panchayati Raj, Public Policy, Parliament), Economic & Social Development (Poverty, Inclusion, Sustainable Development), Environment & Ecology (Biodiversity, Climate Change), General Science (Physics, Chemistry, Biology), Current Affairs (National & International)',
    upsc_cds: 'UPSC CDS - English (Error Detection, Comprehension, Fill Blanks, Sentence Arrangement, Synonyms/Antonyms), General Knowledge (Indian History, Geography, Indian Polity, Indian Economy, Physics, Chemistry, Biology, Defence of India, Current Events, Environmental Science), Elementary Mathematics (Number System, Algebra, Trigonometry, Statistics, Geometry, Mensuration)',
    upsc_nda: 'UPSC NDA/NA General Ability Paper-2 - English Comprehension, Physics (Laws of Motion, Energy, Optics, Electricity, Magnetism), Chemistry (Chemical Changes, Properties of Elements, Chemical Equations, Carbon Compounds), Biology (Cell Biology, Human Body, Food & Nutrition, Diseases & their Prevention), History (Indian History & Freedom Struggle), Geography (Physical Earth, Solar System, India Geography), Indian Polity, Current Events',
    ibps_po: 'IBPS PO Prelims - English Language (Reading Comprehension, Cloze Test, Para Jumbles, Error Spotting, Fill Blanks), Quantitative Aptitude (Data Interpretation - Tables/Pie Chart/Bar Graph, Number Series, Quadratic Equations, Arithmetic - Percentage/Profit-Loss/SI-CI/Time-Work/Speed-Distance), Reasoning Ability (Puzzles, Seating Arrangement - Linear/Circular, Syllogism, Blood Relations, Direction Test, Inequality, Coding-Decoding, Input-Output)',
    ibps_clerk: 'IBPS Clerk Prelims - English Language (Comprehension, Error Detection, Fill Blanks, Phrase Replacement, Vocabulary), Numerical Ability (Number Series, Simplification/Approximation, Data Interpretation, Arithmetic Problems - Percentage, Ratio, Average, SI-CI, Profit-Loss), Reasoning Ability (Puzzles & Seating Arrangement, Syllogism, Inequality, Coding-Decoding, Alphanumeric Series, Blood Relations)',
    sbi_po: 'SBI PO Prelims - English Language (Reading Comprehension, Cloze Test, Error Detection, Para Jumbles, Fill Blanks, Vocabulary), Quantitative Aptitude (Data Interpretation, Quantity Comparison, Missing Number Series, Approximation, Arithmetic Problems), Reasoning Ability (Puzzles, Seating Arrangement, Inequality, Logical Reasoning, Coding-Decoding, Blood Relations)',
    sbi_clerk: 'SBI Clerk Prelims - English Language (Reading Comprehension, Sentence Rearrangement, Cloze Test, Error Spotting, Vocabulary), Numerical Ability (Simplification/Approximation, Number Series, Arithmetic, Data Interpretation), Reasoning Ability (Puzzles, Directions, Coded Inequalities, Alpha-Numeric Series, Blood Relations)',
    rrb_ntpc: 'RRB NTPC - Mathematics (Number System, Decimals/Fractions, LCM/HCF, Ratio/Proportion, Percentage, Mensuration, Time-Work, Time-Distance, SI/CI, Profit-Loss, Elementary Algebra, Geometry/Trigonometry, Elementary Statistics), General Intelligence & Reasoning (Analogies, Number/Alphabetical Series, Coding-Decoding, Mathematical Operations, Similarities/Differences, Relationships, Analytical Reasoning, Venn Diagrams), General Awareness (Current Events, Sports, Art & Culture, Indian Literature, Monuments, Economy, Famous Personalities, Government Programmes, Science)',
    rrb_gd: 'RRB Group D - Mathematics (Number System, BODMAS, Decimals/Fractions, LCM/HCF, Ratio/Proportion, Percentage, Mensuration, Time-Work, Time-Distance, SI/CI, Profit-Loss, Algebra, Geometry/Trigonometry), General Intelligence & Reasoning (Analogies, Alpha-Numeric Series, Coding-Decoding, Mathematical Operations, Relationships, Syllogism, Venn Diagrams, Data Interpretation), General Science (Physics - Motion/Force/Work; Chemistry - Elements/Chemical Reactions; Life Science - Cells/Human Body), General Awareness & Current Affairs',
    rrb_alp: 'RRB ALP - Mathematics (Number System, BODMAS, LCM/HCF, Ratio, Percentage, Mensuration, Trigonometry), General Intelligence & Reasoning (Analogy, Classification, Series, Venn Diagrams, Data Interpretation), Basic Science & Engineering (Engineering Drawing, Units/Measurements, Mass-Weight-Density, Work-Power-Energy, Speed/Velocity, Heat/Temperature, Basic Electricity, Levers/Simple Machines, Environment/Pollution), General Awareness on Current Affairs',
    jee_main: 'JEE Main - Physics (Kinematics, Laws of Motion, Work-Energy, Gravitation, Thermodynamics, Waves, Electrostatics, Current Electricity, Magnetic Effects, Electromagnetic Induction, Optics, Modern Physics), Chemistry (Atomic Structure, Chemical Bonding, Thermodynamics, Equilibrium, Electrochemistry, s/p/d/f Block Elements, Coordination Compounds, Hydrocarbons, Aldehydes/Ketones, Amines), Mathematics (Sets/Functions, Complex Numbers, Quadratic Equations, Binomial Theorem, Sequences/Series, Coordinate Geometry, Limits/Derivatives/Integrals, Differential Equations, Vectors, 3D Geometry, Probability)',
    neet_ug: 'NEET UG - Physics (Physical World, Laws of Motion, Work-Energy, Heat, Ray Optics, Electrostatics, Current Electricity, Semiconductor Devices), Chemistry (Atomic Structure, Chemical Bonding, Thermodynamics, Hydrogen/s-Block/p-Block/d-f Block, Organic - Hydrocarbons/Biomolecules/Polymers), Botany (Plant Cell, Transport in Plants, Photosynthesis, Reproduction, Genetics, Ecology), Zoology (Animal Kingdom, Human Physiology - Digestion/Breathing/Circulation/Locomotion/Neural Control, Reproduction, Human Health & Disease)',
    cuet: 'CUET UG General Test - Critical Thinking (Mathematical Reasoning, Logical and Analytical Reasoning), Quantitative Reasoning (Data Interpretation, Numerical Aptitude), General Awareness (Current Events, General Mental Ability), Language Comprehension (Reading Comprehension, Vocabulary usage, Grammar)',
    delhi_police: 'Delhi Police Constable - Reasoning (Analogy, Classification, Number Series, Coding-Decoding, Puzzle, Blood Relation, Direction Sense), Numerical Ability (Number System, HCF-LCM, Percentage, Profit-Loss, SI-CI, Time-Work, Time-Distance, Mensuration), General Knowledge (Indian History, Geography, Polity, Economy, Science, Sports, Current Affairs, Delhi Specific GK), English (Comprehension, Error Spotting, Synonyms/Antonyms), Computer Knowledge (Basic concepts)',
    ctet: 'CTET Paper-1 - Child Development & Pedagogy (Development of Elementary School Child, Inclusive Education Concept, Learning & Pedagogy, Individual Differences), Language-I Hindi (Language Comprehension Passages, Pedagogy of Language Development), Language-II English (Unseen Passages, Language Elements, Pedagogy), Mathematics (Numbers, Shapes/Spatial Understanding, Measurement, Data Handling, Patterns, Geometry, Pedagogical Issues), Environmental Studies (Family & Friends, Food, Shelter, Water, Travel, Things We Make, Pedagogical Issues)',
};

const callGroq = (messages) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 3000 });
    const options = {
        hostname: GROQ_HOST, path: GROQ_PATH, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Length': Buffer.byteLength(body) },
        timeout: 30000,
    };
    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
            try {
                const p = JSON.parse(data);
                if (p.error) return reject(new Error(p.error.message || JSON.stringify(p.error)));
                resolve(p?.choices?.[0]?.message?.content || '');
            } catch { reject(new Error('Invalid Groq response')); }
        });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body); req.end();
});

const extractJSON = (text) => {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return JSON.parse(fenced[1].trim());
    const arr = text.match(/\[[\s\S]*\]/);
    if (arr) return JSON.parse(arr[0]);
    return JSON.parse(text.trim());
};

const generateTest = async (req, res) => {
    try {
        const { examCode, category, mode = 'mcq', difficulty = 'medium', count = 10, lang = 'en' } = req.body;
        const topic = EXAM_TOPICS[examCode] || EXAM_TOPICS[category] || EXAM_TOPICS.upsc_cse;
        const langNote = lang === 'hi' ? 'Write ALL content in Hindi (Devanagari script).' : 'Write in English.';
        const modePrompt = mode === 'mcq'
            ? `Generate exactly ${Math.min(count, 15)} ${difficulty}-difficulty MCQ questions strictly based on: ${topic}.\n${langNote}\nReturn ONLY a JSON array. Each object: { "id": number, "question": string, "options": [4 strings], "correct": 0-indexed number, "explanation": string }`
            : `Generate exactly ${Math.min(count, 15)} ${difficulty}-difficulty short-answer questions on: ${topic}.\n${langNote}\nReturn ONLY a JSON array. Each object: { "id": number, "question": string, "hint": string, "modelAnswer": string, "keywords": [3-5 strings] }`;

        const messages = [
            { role: 'system', content: `You are an expert Indian competitive exam coach. Respond with ONLY valid JSON array. No markdown or text outside the JSON.` },
            { role: 'user', content: modePrompt },
        ];
        const raw = await callGroq(messages);
        const questions = extractJSON(raw);
        if (!Array.isArray(questions) || !questions.length) throw new Error('Invalid format');
        res.json({ success: true, questions, meta: { examCode, mode, difficulty, lang, total: questions.length } });
    } catch (err) {
        console.error('Generate error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

const evaluateTest = async (req, res) => {
    try {
        const { answers, lang = 'en' } = req.body;
        if (!answers?.length) return res.status(400).json({ success: false, message: 'No answers' });
        const langNote = lang === 'hi' ? 'Respond in Hindi.' : 'Respond in English.';
        const formatted = answers.map((a, i) =>
            `Q${i + 1}: ${a.question}\nModel: ${a.modelAnswer}\nKeywords: ${(a.keywords || []).join(', ')}\nStudent: ${a.studentAnswer || '(blank)'}`
        ).join('\n\n---\n\n');
        const messages = [
            { role: 'system', content: `Evaluate student answers for Indian competitive exams. ${langNote} Return ONLY JSON array. Each object: { "id": 1-indexed number, "score": 0-5 integer, "feedback": 1 sentence, "correct": boolean (true if score >= 3) }` },
            { role: 'user', content: `Evaluate ${answers.length} answers:\n\n${formatted}` },
        ];
        const raw = await callGroq(messages);
        const evaluation = extractJSON(raw);
        const totalScore = evaluation.reduce((s, e) => s + (e.score || 0), 0);
        const maxScore = answers.length * 5;
        const pct = Math.round((totalScore / maxScore) * 100);
        const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
        res.json({ success: true, evaluation, summary: { totalScore, maxScore, percentage: pct, grade, message: pct >= 80 ? 'Excellent! 🏆' : pct >= 60 ? 'Good Job! 👍' : pct >= 40 ? 'Keep Practicing! 📚' : 'Needs More Effort 💪' } });
    } catch (err) {
        console.error('Evaluate error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { generateTest, evaluateTest };
