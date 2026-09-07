const https = require('https');

const GROQ_HOST = 'api.groq.com';
const GROQ_PATH = '/openai/v1/chat/completions';
const GROQ_MODELS = [
    'openai/gpt-oss-120b',      // High quality, tested 200 OK
    'openai/gpt-oss-20b',       // Fast fallback
    'qwen/qwen3.8-27b',         // Reasoning
    'qwen/qwen3.6-27b',         // Fast fallback
    'allam-2-7b',               // Lightweight fallback
];

/**
 * Call Groq API with automatic multi-key and multi-model rotation
 * @param {Array} messages - Chat completion messages array [{ role, content }]
 * @param {Object} options - temperature, max_tokens, etc.
 * @returns {Promise<string>} AI response text
 */
const callGroq = async (messages, { temperature = 0.5, max_tokens = 1500 } = {}) => {
    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_2,
        process.env.GROQ_API_KEY_3,
    ].filter(Boolean);

    if (keys.length === 0) {
        throw new Error('No Groq API key configured in environment');
    }

    let lastError = null;

    for (let ki = 0; ki < keys.length; ki++) {
        const apiKey = keys[ki];
        for (const model of GROQ_MODELS) {
            try {
                const text = await new Promise((resolve, reject) => {
                    const body = JSON.stringify({
                        model,
                        messages,
                        temperature,
                        max_tokens,
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
                        timeout: 25000,
                    }, (res) => {
                        let data = '';
                        res.on('data', chunk => { data += chunk; });
                        res.on('end', () => {
                            if (res.statusCode === 429) {
                                return reject(new Error('rate_limit'));
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.error) {
                                    return reject(new Error(parsed.error.message || 'Groq error'));
                                }
                                resolve(parsed?.choices?.[0]?.message?.content || '');
                            } catch (e) {
                                reject(new Error('Invalid response from AI server'));
                            }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => {
                        req.destroy();
                        reject(new Error('AI request timeout'));
                    });
                    req.write(body);
                    req.end();
                });

                if (text && text.trim()) {
                    return text.trim();
                }
            } catch (err) {
                lastError = err;
                console.warn(`[AI Service] Key[${ki}] Model[${model}] failed: ${err.message}`);
                if (err.message === 'rate_limit') {
                    // Try next key immediately on rate limit
                    break;
                }
            }
        }
    }

    throw lastError || new Error('All AI models failed');
};

module.exports = {
    callGroq,
    GROQ_MODELS,
};
