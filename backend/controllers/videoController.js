/**
 * Video Learning Controller
 * Proxies YouTube Data API v3 — keeps API key server-side.
 * Filters: Education category + safeSearch strict.
 * Videos ≥ 2 minutes only (medium + long duration).
 * Auto-prepends student's examTarget / exam override to every query.
 * Rejects off-topic / non-study searches.
 */

/* ─── Exam → search prefix map ────────────────────────────────────────────── */
const EXAM_PREFIX_MAP = {
    upsc_cse:   'UPSC CSE IAS',
    upsc_cds:   'UPSC CDS',
    ssc_cgl:    'SSC CGL',
    ssc_chsl:   'SSC CHSL',
    ssc_gd:     'SSC GD Constable',
    ssc_mts:    'SSC MTS',
    ssc_cpo:    'SSC CPO',
    ibps_po:    'IBPS PO Banking',
    ibps_clerk: 'IBPS Clerk Banking',
    sbi_po:     'SBI PO Banking',
    sbi_clerk:  'SBI Clerk Banking',
    rrb_ntpc:   'RRB NTPC Railway',
    jee_main:   'JEE Main',
    neet_ug:    'NEET UG Biology',
    bpsc_pre:   'BPSC CCE',
    bpse_pre:   'BPSC CCE',
    class_6:    'Class 6 NCERT',
    class_7:    'Class 7 NCERT',
    class_8:    'Class 8 NCERT',
    class_9:    'Class 9 NCERT',
    class_10:   'Class 10 NCERT',
    class_11:   'Class 11 NCERT',
    class_12:   'Class 12 NCERT',
    generic:    'competitive exam study',
};

/* ─── Off-topic keyword blocklist ─────────────────────────────────────────── */
const BLOCKED_PATTERNS = [
    /\b(motivat|inspir|success story|how to be rich|earn money|make money|business tips|lifestyle|vlog|travel|food|recipe|cooking|fashion|song|music|dance|movie|comedy|funny|prank|roast|gaming|game|entertainment|cricket|football|sports|celebrity|devotional|bhajan|status video|whatsapp)\b/i,
];

/* ─── Study keyword allowlist (at least one required for custom searches) ─── */
const STUDY_KEYWORDS = [
    /\b(lecture|class|chapter|topic|study|notes|exam|test|revision|mcq|question|answer|concept|explain|solution|formula|theorem|law|subject|history|geography|polity|economy|science|physics|chemistry|biology|maths|math|english|hindi|reasoning|gk|general knowledge|current affairs|aptitude|syllabus|paper|preparation|strategy|tips|trick|shortcut|ncert|book|reading|learning|education|course|coaching|mock|practice|series|complete|full course|crash course|batch)\b/i,
];

/* ─── YouTube base URLs ────────────────────────────────────────────────────── */
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

/* ─── Helper: build URL with query params ──────────────────────────────────── */
function buildUrl(base, params) {
    const url = new URL(base);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
}

/* ─── Helper: ISO 8601 duration → total seconds ────────────────────────────── */
function durationToSeconds(iso) {
    if (!iso) return 0;
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

/* ─── searchVideos  GET /api/student/videos?q=&page=&exam=&lang= ───────────── */
exports.searchVideos = async (req, res) => {
    try {
        const { q = '', page, exam: examOverride, lang = 'hi' } = req.query;
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            console.error('[VideoSearch] YOUTUBE_API_KEY not set in environment');
            return res.status(503).json({ message: 'Video service not configured. Add YOUTUBE_API_KEY to backend .env' });
        }

        // Allow frontend to override exam (exam selector)
        const examTarget = examOverride || req.user?.examTarget || 'generic';
        const examPrefix = EXAM_PREFIX_MAP[examTarget] || 'competitive exam study';

        const userTerm = q.trim().toLowerCase();

        /* ── Validate search query ─────────────────────────────────────────── */
        if (userTerm) {
            const isBlocked  = BLOCKED_PATTERNS.some(p => p.test(userTerm));
            const hasStudyWord = STUDY_KEYWORDS.some(p => p.test(userTerm));
            if (isBlocked || !hasStudyWord) {
                return res.status(422).json({
                    invalidSearch: true,
                    message: 'Please search study-related topics only (e.g. History, Polity, Maths, Physics, Current Affairs)',
                });
            }
        }

        // Language-aware query — append language keyword for better results
        const langSuffix = lang === 'en' ? 'in English' : 'in Hindi';
        const searchQuery = userTerm
            ? `${examPrefix} ${userTerm} lecture ${langSuffix}`
            : `${examPrefix} lecture ${langSuffix}`;

        console.log(`[VideoSearch] exam=${examTarget} lang=${lang} | query="${searchQuery}" | page=${page || 'first'}`);

        /* ── Step 1: Search API ─────────────────────────────────────────────── */
        // videoDuration=medium (4–20 min) and long (>20 min) both qualify for >=2 min.
        // YouTube API does not have a "short" filter that includes 2-4 min, so we use
        // medium+long via two calls OR use no duration filter + post-filter by seconds.
        // We use no duration filter + post-filter (>=120 seconds) for maximum flexibility.
        const searchUrl = buildUrl(YT_SEARCH_URL, {
            key:              apiKey,
            q:                searchQuery,
            part:             'snippet',
            type:             'video',
            videoCategoryId:  '27',    // Education
            safeSearch:       'strict',
            relevanceLanguage: lang === 'en' ? 'en' : 'hi',
            maxResults:       20,
            pageToken:        page || undefined,
        });

        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) {
            const errBody = await searchResp.json().catch(() => ({}));
            console.error('[VideoSearch] YouTube search error:', errBody);
            return res.status(502).json({ message: 'YouTube API error', detail: errBody?.error?.message });
        }
        const searchData = await searchResp.json();

        const items         = searchData.items || [];
        const nextPageToken = searchData.nextPageToken || null;

        if (items.length === 0) {
            return res.json({ videos: [], nextPageToken: null, examPrefix });
        }

        const videoIds = items.map(i => i.id?.videoId).filter(Boolean).join(',');

        /* ── Step 2: Video details (duration + views) ──────────────────────── */
        const detailUrl = buildUrl(YT_VIDEOS_URL, {
            key:  apiKey,
            id:   videoIds,
            part: 'contentDetails,statistics',
        });

        const detailResp = await fetch(detailUrl);
        const detailData = detailResp.ok ? await detailResp.json() : { items: [] };

        const detailMap = {};
        (detailData.items || []).forEach(v => {
            detailMap[v.id] = {
                duration:  v.contentDetails?.duration || '',
                viewCount: v.statistics?.viewCount    || '0',
            };
        });

        /* ── Build response — post-filter: must be ≥ 120 seconds (2 min) ──── */
        const videos = items
            .filter(item => item.id?.videoId)
            .map(item => {
                const vid = item.id.videoId;
                const secs = durationToSeconds(detailMap[vid]?.duration || '');
                return {
                    id:          vid,
                    title:       item.snippet.title,
                    channel:     item.snippet.channelTitle,
                    thumbnail:   item.snippet.thumbnails?.medium?.url
                                 || item.snippet.thumbnails?.default?.url
                                 || '',
                    publishedAt: item.snippet.publishedAt,
                    duration:    detailMap[vid]?.duration  || '',
                    viewCount:   detailMap[vid]?.viewCount || '0',
                    seconds:     secs,
                };
            })
            .filter(v => v.seconds >= 120); // ≥ 2 minutes

        res.json({ videos, nextPageToken, examPrefix });

    } catch (err) {
        console.error('[VideoSearch] Unhandled error:', err.message);
        res.status(500).json({ message: 'Failed to fetch videos. Please try again.' });
    }
};
