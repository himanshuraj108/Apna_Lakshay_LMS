const https = require('https');

// RSS sources — English and Hindi versions
const RSS_SOURCES = [
    { name: 'UPSC',  enQuery: 'UPSC exam notification 2025',          hiQuery: 'UPSC pariksha bharti 2025',         color: 'red',    category: 'Civil Services'   },
    { name: 'SSC',   enQuery: 'SSC exam notification 2025',           hiQuery: 'SSC pariksha bharti 2025',          color: 'blue',   category: 'Staff Selection'  },
    { name: 'IBPS',  enQuery: 'IBPS bank exam 2025',                  hiQuery: 'IBPS bank pariksha 2025',           color: 'green',  category: 'Banking'          },
    { name: 'NTA',   enQuery: 'NTA JEE NEET exam 2025',               hiQuery: 'NTA JEE NEET pariksha 2025',        color: 'purple', category: 'National Testing' },
];

const buildFeedUrl = (query, lang) => {
    const hl   = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const ceid = lang === 'hi' ? 'IN:hi' : 'IN:en';
    return `https://news.google.com/rss/search?hl=${hl}&gl=IN&ceid=${ceid}&q=${encodeURIComponent(query)}`;
};

const RSS2JSON_BASE   = 'https://api.rss2json.com/v1/api.json?rss_url=';
const RSS2JSON_API_KEY = process.env.RSS2JSON_KEY || '';

const fetchJson = (url) => new Promise((resolve, reject) => {
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

// Separate caches per language
const cacheStore = { en: null, hi: null };
const cacheTime  = { en: 0,    hi: 0   };
const CACHE_TTL  = 30 * 60 * 1000; // 30 minutes

const getExamAlerts = async (req, res) => {
    const lang = req.query.lang === 'hi' ? 'hi' : 'en';
    try {
        if (cacheStore[lang] && Date.now() - cacheTime[lang] < CACHE_TTL) {
            return res.json({ success: true, data: cacheStore[lang], cached: true });
        }

        const results = await Promise.allSettled(
            RSS_SOURCES.map(async (src) => {
                const query  = lang === 'hi' ? src.hiQuery : src.enQuery;
                const feedUrl = buildFeedUrl(query, lang);
                const apiUrl  = `${RSS2JSON_BASE}${encodeURIComponent(feedUrl)}&count=10&api_key=${RSS2JSON_API_KEY}`;
                const json    = await fetchJson(apiUrl);

                if (json.status !== 'ok' || !Array.isArray(json.items)) return [];

                return json.items.map(item => ({
                    title:       (item.title || '').replace(/&amp;/g, '&').slice(0, 150),
                    link:        item.link || item.guid || `https://${src.name.toLowerCase()}.gov.in`,
                    description: (item.description || item.content || '')
                        .replace(/<[^>]*>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&nbsp;/g, ' ')
                        .trim()
                        .slice(0, 220),
                    pubDate:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    source:   src.name,
                    color:    src.color,
                    category: src.category,
                }));
            })
        );

        let allItems = [];
        results.forEach(r => { if (r.status === 'fulfilled') allItems = allItems.concat(r.value); });
        allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        allItems = allItems.slice(0, 50);

        if (allItems.length === 0) throw new Error('No alerts fetched');

        cacheStore[lang] = allItems;
        cacheTime[lang]  = Date.now();

        res.json({ success: true, data: allItems, cached: false });
    } catch (err) {
        console.error('Exam alerts error:', err.message);
        if (cacheStore[lang]) return res.json({ success: true, data: cacheStore[lang], cached: true, stale: true });
        res.status(500).json({ success: false, message: 'Failed to fetch exam alerts' });
    }
};

module.exports = { getExamAlerts };
