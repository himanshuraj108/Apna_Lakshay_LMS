const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
    
    redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn('⚠️ Redis connection failed. Falling back to Mock store.');
                isRedisConnected = false;
                return null;
            }
            return Math.min(times * 100, 2000);
        }
    });

    redisClient.on('connect', () => {
        console.log('✅ Connected to Redis successfully');
        isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
        console.warn('⚠️ Redis error:', err.message);
        isRedisConnected = false;
    });
} else {
    console.log('ℹ️ No REDIS_URL or REDIS_HOST env variable found. Using Mock Redis store.');
}

// Simple In-memory Mock Redis Client fallback
const mockStore = new Map();
const mockClient = {
    get: async (key) => mockStore.get(key) || null,
    set: async (key, value, mode, duration) => {
        mockStore.set(key, value);
        if (mode === 'EX' && duration) {
            setTimeout(() => mockStore.delete(key), duration * 1000);
        }
        return 'OK';
    },
    del: async (key) => {
        mockStore.delete(key);
        return 1;
    },
    keys: async (pattern) => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return Array.from(mockStore.keys()).filter(key => regex.test(key));
    }
};

const getClient = () => {
    if (isRedisConnected && redisClient) {
        return redisClient;
    }
    return mockClient;
};

module.exports = {
    getClient,
    isRedisConnected: () => isRedisConnected
};
