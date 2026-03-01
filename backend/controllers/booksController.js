const https = require('https');

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

const CATEGORY_QUERIES_EN = {
    upsc: 'UPSC civil services IAS general studies',
    ssc: 'SSC CGL CHSL staff selection commission',
    banking: 'IBPS SBI bank PO clerk exam',
    nta: 'JEE NEET NTA entrance exam',
    ncert: 'NCERT textbook class 11 12',
    rrb: 'RRB NTPC railway recruitment board exam',
    reasoning: 'logical reasoning aptitude quantitative',
    english: 'english grammar vocabulary competitive exam',
    gk: 'general knowledge current affairs India 2025',
};

// Preset exam categories — Hindi
const CATEGORY_QUERIES_HI = {
    upsc: 'UPSC IAS सामान्य अध्ययन',
    ssc: 'SSC CGL सामान्य ज्ञान हिंदी',
    banking: 'बैंक परीक्षा IBPS SBI हिंदी',
    nta: 'JEE NEET NTA प्रवेश परीक्षा हिंदी',
    ncert: 'NCERT पाठ्यपुस्तक हिंदी',
    rrb: 'RRB NTPC रेलवे भर्ती हिंदी',
    reasoning: 'तर्कशक्ति अभिक्षमता हिंदी',
    english: 'अंग्रेजी व्याकरण प्रतियोगी परीक्षा',
    gk: 'सामान्य ज्ञान करेंट अफेयर्स भारत',
};

const fetchBooks = (url) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
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

const formatBook = (item) => {
    const v = item.volumeInfo || {};
    return {
        id: item.id,
        title: v.title || 'Untitled',
        authors: v.authors || ['Unknown Author'],
        description: (v.description || '').slice(0, 300),
        thumbnail: v.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        previewLink: v.previewLink || null,
        pageCount: v.pageCount || null,
        publishedDate: v.publishedDate || null,
        categories: v.categories || [],
        language: v.language || 'en',
        rating: v.averageRating || null,
        ratingsCount: v.ratingsCount || 0,
    };
};

// Simple in-memory cache
const cache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const getBooks = async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = (req.query.category || '').toLowerCase();
        const lang = req.query.lang === 'hi' ? 'hi' : 'en';
        const maxResults = Math.min(parseInt(req.query.limit) || 20, 40);

        const QUERIES = lang === 'hi' ? CATEGORY_QUERIES_HI : CATEGORY_QUERIES_EN;
        const searchQ = query.trim()
            ? query.trim()
            : QUERIES[category] || QUERIES.upsc;

        const cacheKey = `${searchQ}-${maxResults}-${lang}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].time < CACHE_TTL) {
            return res.json({ success: true, data: cache[cacheKey].data, cached: true });
        }

        const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
        const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(searchQ)}&maxResults=${maxResults}&printType=books&langRestrict=${lang}&key=${apiKey}`;

        const result = await fetchBooks(url);
        const books = (result.items || []).map(formatBook);

        cache[cacheKey] = { data: books, time: Date.now() };
        res.json({ success: true, data: books, cached: false, total: result.totalItems || 0 });
    } catch (err) {
        console.error('Books API error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch books' });
    }
};

module.exports = { getBooks };
