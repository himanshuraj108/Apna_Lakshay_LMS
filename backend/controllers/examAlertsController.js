const https = require('https');

// RSS sources — Google News RSS (free, reliable, always current)
const RSS_SOURCES = [
    {
        name: 'UPSC',
        feedUrl: 'https://news.google.com/rss/search?q=UPSC+exam+notification+2025&hl=en-IN&gl=IN&ceid=IN:en',
        color: 'red',
        category: 'Civil Services'
    },
    {
        name: 'SSC',
        feedUrl: 'https://news.google.com/rss/search?q=SSC+exam+notification+2025&hl=en-IN&gl=IN&ceid=IN:en',
        color: 'blue',
        category: 'Staff Selection'
    },
    {
        name: 'IBPS',
        feedUrl: 'https://news.google.com/rss/search?q=IBPS+bank+exam+2025&hl=en-IN&gl=IN&ceid=IN:en',
        color: 'green',
        category: 'Banking'
    },
    {
        name: 'NTA',
        feedUrl: 'https://news.google.com/rss/search?q=NTA+JEE+NEET+exam+2025&hl=en-IN&gl=IN&ceid=IN:en',
        color: 'purple',
        category: 'National Testing'
    }
];

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
const RSS2JSON_API_KEY = process.env.RSS2JSON_KEY || '';

// Simple HTTPS GET
const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('Invalid JSON response')); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
};

// Cache
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const getExamAlerts = async (req, res) => {
    try {
        // Return cached if fresh
        if (cache && Date.now() - cacheTime < CACHE_TTL) {
            return res.json({ success: true, data: cache, cached: true });
        }

        const results = await Promise.allSettled(
            RSS_SOURCES.map(async (src) => {
                const apiUrl = `${RSS2JSON_BASE}${encodeURIComponent(src.feedUrl)}&count=10&api_key=${RSS2JSON_API_KEY}`;
                const json = await fetchJson(apiUrl);

                if (json.status !== 'ok' || !Array.isArray(json.items)) return [];

                return json.items.map(item => ({
                    title: (item.title || '').replace(/&amp;/g, '&').slice(0, 150),
                    link: item.link || item.guid || `https://${src.name.toLowerCase()}.gov.in`,
                    description: (item.description || item.content || '')
                        .replace(/<[^>]*>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&nbsp;/g, ' ')
                        .trim()
                        .slice(0, 220),
                    pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    source: src.name,
                    color: src.color,
                    category: src.category
                }));
            })
        );

        let allItems = [];
        results.forEach(r => {
            if (r.status === 'fulfilled') allItems = allItems.concat(r.value);
        });

        // Sort newest first
        allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        allItems = allItems.slice(0, 50);

        if (allItems.length === 0) {
            throw new Error('Failed to fetch alerts from news sources');
        }

        cache = allItems;
        cacheTime = Date.now();

        res.json({ success: true, data: allItems, cached: false });
    } catch (err) {
        console.error('Exam alerts error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch exam alerts' });
    }
};

module.exports = { getExamAlerts };
