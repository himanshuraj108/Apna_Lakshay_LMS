const https = require('https');

// Internet Archive Search API — completely free, no key needed
const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';

const CATEGORY_QUERIES_EN = {
    upsc: 'UPSC IAS civil services general studies notes',
    ssc: 'SSC CGL CHSL staff selection notes',
    banking: 'IBPS SBI bank PO clerk notes',
    nta: 'JEE NEET NTA entrance notes',
    ncert: 'NCERT notes class 11 12',
    reasoning: 'logical reasoning aptitude notes',
    english: 'english grammar vocabulary competitive exam notes',
    gk: 'general knowledge current affairs India notes',
    polity: 'Indian polity constitution notes',
    history: 'Indian history ancient medieval modern notes',
    geography: 'Indian world geography notes',
    economy: 'Indian economy budget notes',
};

const CATEGORY_QUERIES_HI = {
    upsc: 'UPSC IAS सामान्य अध्ययन नोट्स हिंदी',
    ssc: 'SSC CGL CHSL हिंदी नोट्स',
    banking: 'बैंक परीक्षा IBPS SBI नोट्स हिंदी',
    nta: 'JEE NEET NTA हिंदी नोट्स',
    ncert: 'NCERT हिंदी पाठ्यपुस्तक नोट्स',
    reasoning: 'तर्कशक्ति अभिक्षमता हिंदी नोट्स',
    english: 'अंग्रेजी व्याकरण प्रतियोगी परीक्षा नोट्स',
    gk: 'सामान्य ज्ञान करेंट अफेयर्स भारत हिंदी',
    polity: 'भारतीय संविधान राजव्यवस्था हिंदी नोट्स',
    history: 'भारतीय इतिहास प्राचीन मध्यकालीन आधुनिक हिंदी',
    geography: 'भारतीय विश्व भूगोल हिंदी नोट्स',
    economy: 'भारतीय अर्थव्यवस्था बजट हिंदी नोट्स',
};


const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 12000 }, (res) => {
            // Follow redirects
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                return fetchJson(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('Invalid JSON')); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
};

const formatNote = (doc) => {
    const identifier = doc.identifier;
    const title = Array.isArray(doc.title) ? doc.title[0] : (doc.title || 'Untitled');
    const creator = Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Unknown');
    const description = Array.isArray(doc.description)
        ? doc.description[0]
        : (doc.description || '');
    const subject = Array.isArray(doc.subject) ? doc.subject : [];

    return {
        id: identifier,
        title: title.slice(0, 120),
        author: creator,
        description: description.replace(/<[^>]*>/g, '').slice(0, 250),
        subjects: subject.slice(0, 4),
        year: doc.year || null,
        downloads: doc.downloads || 0,
        format: Array.isArray(doc.format) ? doc.format : [],
        // Direct links
        detailUrl: `https://archive.org/details/${identifier}`,
        downloadUrl: `https://archive.org/download/${identifier}`,
        thumbnail: `https://archive.org/services/img/${identifier}`,
        hasPdf: Array.isArray(doc.format)
            ? doc.format.some(f => f.toLowerCase().includes('pdf'))
            : false,
    };
};

// Cache
const cache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const getNotes = async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = (req.query.category || '').toLowerCase();
        const lang = req.query.lang === 'hi' ? 'hi' : 'en';
        const rows = Math.min(parseInt(req.query.limit) || 20, 40);

        const QUERIES = lang === 'hi' ? CATEGORY_QUERIES_HI : CATEGORY_QUERIES_EN;
        const searchQ = query.trim()
            ? query.trim()
            : QUERIES[category] || QUERIES.upsc;

        // Add language filter for Archive.org
        const langFilter = lang === 'hi' ? ' AND language:hindi' : '';

        const cacheKey = `${searchQ}-${rows}-${lang}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].time < CACHE_TTL) {
            return res.json({ success: true, data: cache[cacheKey].data, cached: true });
        }

        const params = new URLSearchParams({
            q: `${searchQ}${langFilter} AND mediatype:texts`,
            fl: 'identifier,title,creator,description,subject,year,downloads,format',
            rows: String(rows),
            output: 'json',
            sort: 'downloads desc',
        });

        const url = `${ARCHIVE_SEARCH}?${params}`;
        const result = await fetchJson(url);
        const docs = result?.response?.docs || [];
        const notes = docs.map(formatNote).filter(n => n.title && n.title !== 'Untitled');

        cache[cacheKey] = { data: notes, time: Date.now() };
        res.json({ success: true, data: notes, cached: false, total: result?.response?.numFound || 0 });
    } catch (err) {
        console.error('Notes API error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
};

module.exports = { getNotes };
