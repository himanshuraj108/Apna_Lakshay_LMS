const https = require('https');

const CATEGORIES = [
    { id: 'india',   name: 'India',         enQuery: 'India national news today',                hiQuery: 'India rashtriya samachar aaj',            color: 'orange' },
    { id: 'world',   name: 'World',          enQuery: 'world international news today',           hiQuery: 'vishwa antararashtriya samachar aaj',      color: 'blue'   },
    { id: 'economy', name: 'Economy',        enQuery: 'India economy finance business news',      hiQuery: 'India arthvyavastha vyapar samachar',      color: 'green'  },
    { id: 'science', name: 'Science & Tech', enQuery: 'science technology India news today',      hiQuery: 'vigyan prodyogiki India samachar',         color: 'purple' },
    { id: 'sports',  name: 'Sports',         enQuery: 'India sports cricket news today',          hiQuery: 'India khel cricket samachar aaj',          color: 'red'    },
    { id: 'govt',    name: 'Government',     enQuery: 'India government policy scheme news',      hiQuery: 'India sarkar yojana niti samachar',        color: 'yellow' },
];

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
const RSS2JSON_KEY  = process.env.RSS2JSON_KEY || '';

const buildFeedUrl = (query, lang) => {
    const hl   = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const ceid = lang === 'hi' ? 'IN:hi' : 'IN:en';
    return `https://news.google.com/rss/search?hl=${hl}&gl=IN&ceid=${ceid}&q=${encodeURIComponent(query)}`;
};

const fetchJson = (url) => new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 12000 }, (res) => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error('Invalid JSON')); }
        });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
});

// Cache: 1 hour per language
const cacheStore = { en: null, hi: null };
const cacheTime  = { en: 0,    hi: 0   };
const CACHE_TTL = 60 * 60 * 1000;

exports.getCurrentAffairs = async (req, res) => {
    const lang = req.query.lang === 'hi' ? 'hi' : 'en';
    try {
        if (cacheStore[lang] && Date.now() - cacheTime[lang] < CACHE_TTL) {
            return res.json({ success: true, data: cacheStore[lang], cached: true });
        }

        const results = await Promise.allSettled(
            CATEGORIES.map(async (cat) => {
                const query   = lang === 'hi' ? cat.hiQuery : cat.enQuery;
                const feedUrl = buildFeedUrl(query, lang);
                const apiUrl  = `${RSS2JSON_BASE}${encodeURIComponent(feedUrl)}&count=8&api_key=${RSS2JSON_KEY}`;
                const json    = await fetchJson(apiUrl);

                if (json.status !== 'ok' || !Array.isArray(json.items)) return [];

                return json.items.map(item => ({
                    id: item.guid || item.link,
                    title: (item.title || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").slice(0, 160),
                    link: item.link || '#',
                    source: (item.author || 'News').split('·')[0].trim().slice(0, 40),
                    pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    category: cat.id,
                    categoryName: cat.name,
                    color: cat.color,
                }));
            })
        );

        let all = [];
        results.forEach(r => { if (r.status === 'fulfilled') all = all.concat(r.value); });

        // Sort newest first
        all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        all = all.slice(0, 60);

        if (all.length === 0) throw new Error('No articles fetched');

        cacheStore[lang] = all;
        cacheTime[lang]  = Date.now();

        res.json({ success: true, data: all, cached: false });
    } catch (err) {
        console.error('Current affairs error:', err.message);
        if (cacheStore[lang]) return res.json({ success: true, data: cacheStore[lang], cached: true, stale: true });
        res.status(500).json({ success: false, message: 'Failed to fetch current affairs' });
    }
};
