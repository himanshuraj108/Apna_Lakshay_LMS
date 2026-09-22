/**
 * Apna Lakshay LMS — Application Bootstrap
 * ------------------------------------------
 * Initializes Express, security middleware, routes,
 * database connection, socket layer, and scheduled workers.
 */

'use strict';

require('dotenv').config();

const { printBanner, section, status, createLogger } = require('./utils/logger');
const log = createLogger('server');

// ── Boot Banner ───────────────────────────────────────────────────────────────
printBanner();

const express        = require('express');
const mongoose       = require('mongoose');
const cors           = require('cors');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
const xss            = require('xss-clean');
const hpp            = require('hpp');
const path           = require('path');
const http           = require('http');
const { Server }     = require('socket.io');

// ── Route Modules ─────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const studentRoutes      = require('./routes/studentRoutes');
const publicRoutes       = require('./routes/publicRoutes');
const settingsRoutes     = require('./routes/settingsRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const studyPlannerRoutes = require('./routes/studyPlannerRoutes');
const errorHandler       = require('./middleware/errorHandler');
const socketHandler      = require('./sockets/socketHandler');
const startCronJobs      = require('./utils/cronJobs');

// ── Express Init ──────────────────────────────────────────────────────────────
section('Express');

const app = express();
app.set('trust proxy', 1);
status('Reverse Proxy Trust', 'enabled');

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'https://hamaralakshay.vercel.app',
    'https://apnalakshay.com',
    'https://www.apnalakshay.com',
    /\.vercel\.app$/
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
status('CORS Policy',          `${allowedOrigins.filter(o => typeof o === 'string').length} explicit origins + *.vercel.app`);

// ── Security Middleware ───────────────────────────────────────────────────────
section('Security');

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
status('Helmet (HTTP Headers)', 'Content-Security-Policy + HSTS active');

const limiter = rateLimit({
    windowMs     : 15 * 60 * 1000,
    max          : 1000,
    message      : 'Rate limit exceeded. Retry after 15 minutes.',
    standardHeaders : true,
    legacyHeaders   : false,
});
app.use('/api/', limiter);
status('Rate Limiter',         '1000 req / 15 min per IP on /api/*');

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
status('Body Parser',          'JSON limit: 10 KB | URL-encoded: enabled');

app.use(mongoSanitize());
status('NoSQL Injection Guard', 'express-mongo-sanitize active');

app.use(xss());
status('XSS Filter',           'xss-clean active');

app.use(hpp());
status('HPP Guard',            'HTTP Parameter Pollution blocked');

// ── Static Assets ─────────────────────────────────────────────────────────────
section('Static');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
status('Uploads Mount',        '/uploads -> ./uploads/');

// ── API Routes ────────────────────────────────────────────────────────────────
section('Routes');

app.use('/api/auth',    authRoutes);         status('Route Registered', '/api/auth');
app.use('/api/admin',   adminRoutes);        status('Route Registered', '/api/admin');
app.use('/api/student', studentRoutes);      status('Route Registered', '/api/student');
app.use('/api/public',  publicRoutes);       status('Route Registered', '/api/public');
app.use('/api/settings',settingsRoutes);     status('Route Registered', '/api/settings');
app.use('/api/chat',    chatRoutes);         status('Route Registered', '/api/chat');
app.use('/api/study',   studyPlannerRoutes); status('Route Registered', '/api/study');

app.get('/', (_req, res) => res.json({
    service : 'apna-lakshay-lms',
    status  : 'healthy',
    version : process.env.npm_package_version || '1.0.0',
    ts      : new Date().toISOString()
}));

app.use(errorHandler);
status('Error Handler',        'global error boundary mounted');

// ── HTTP + Socket.io Layer ────────────────────────────────────────────────────
section('Transport');

const server = http.createServer(app);

const socketOrigins = [
    'http://localhost:5173',
    'https://hamaralakshay.vercel.app',
    'https://apnalakshay.com',
    'https://www.apnalakshay.com',
    /\.vercel\.app$/
];

const io = new Server(server, {
    cors: {
        origin  : process.env.CLIENT_URL ? [process.env.CLIENT_URL, ...socketOrigins] : socketOrigins,
        credentials : true,
        methods     : ['GET', 'POST']
    }
});

app.set('io', io);
socketHandler(io);

status('HTTP Server',   'http.createServer(app)');
status('Socket.io',     'WebSocket + long-polling transport enabled');

// ── Database Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
    section('Database');

    if (!process.env.MONGODB_URI) {
        log.fatal('MONGODB_URI is not defined in environment variables');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        const dbName = conn.connection.db.databaseName;
        const host   = conn.connection.host;
        status('MongoDB Atlas',   `Connected to "${dbName}" on ${host}`);
    } catch (err) {
        log.fatal('MongoDB connection failed', { error: err.message });
        // Do not exit — allow health-check routes to remain accessible on serverless
        return;
    }

    // ── DB Migration: Avatar Self-Healing ─────────────────────────────────────
    section('Migrations');

    try {
        const User = require('./models/User');

        const getDeterministicAvatar = (id, gender) => {
            const str = String(id || '');
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
            const index = (hash % 10) + 1;
            const g = gender || 'male';
            if (g === 'female')      return `/uploads/avatars/avatar_female${index}.svg`;
            if (g === 'other')       return hash % 2 === 0
                ? `/uploads/avatars/avatar_female${index}.svg`
                : `/uploads/avatars/avatar_male${index}.svg`;
            return `/uploads/avatars/avatar_male${index}.svg`;
        };

        const students  = await User.find({ role: 'student' });
        let healCount   = 0;

        for (const student of students) {
            const isDefault = !student.profileImage || student.profileImage.startsWith('/uploads/avatars/');
            if (isDefault) {
                const correct = getDeterministicAvatar(student._id, student.gender);
                if (student.profileImage !== correct) {
                    student.profileImage = correct;
                    await student.save({ validateBeforeSave: false });
                    healCount++;
                }
            }
        }

        status('Avatar Migration', healCount > 0
            ? `${healCount} avatar(s) self-healed`
            : `All ${students.length} student avatar(s) consistent`
        );
    } catch (migrationError) {
        log.warn('Avatar migration skipped', { error: migrationError.message });
    }

    // ── Chat Room Init ────────────────────────────────────────────────────────
    try {
        const { initializePublicRoom } = require('./controllers/chatInitializer');
        await initializePublicRoom();
        status('Chat Initializer', 'Public room verified / created');
    } catch (chatError) {
        log.warn('Chat initializer warning', { error: chatError.message });
    }
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────
connectDB().then(() => {
    section('Workers');

    startCronJobs();
    status('Cron Workers', 'Scheduled job queue started');

    if (require.main === module || process.env.NODE_ENV === 'production') {
        const PORT = Number(process.env.PORT) || 5000;

        server.listen(PORT, '0.0.0.0', () => {
            section('Ready');

            const env = (process.env.NODE_ENV || 'development').toUpperCase();
            status('Environment',   env);
            status('Listening',     `0.0.0.0:${PORT}`);
            status('Health Check',  `http://localhost:${PORT}/`);
            status('API Base',      `http://localhost:${PORT}/api`);
            status('State',         'ACCEPTING CONNECTIONS');

            process.stdout.write('\n');
            log.ok(`Process ${process.pid} is fully initialized and serving traffic on port ${PORT}`);
            process.stdout.write('\n');
        });
    }
});

module.exports = app;
