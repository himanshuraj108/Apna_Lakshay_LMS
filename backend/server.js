require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const studyPlannerRoutes = require('./routes/studyPlannerRoutes');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://hamaralakshay.vercel.app',
  'https://apnalakshay.com',
  'https://www.apnalakshay.com'

];

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://hamaralakshay.vercel.app',
    'https://apnalakshay.com',
    'https://www.apnalakshay.com',
    /\.vercel\.app$/
  ],
  credentials: true
}));

// Security Headers
app.use(helmet());

// Cross-Origin Resource Policy (CORP) fix for images/assets if needed
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (relaxed for dashboard usage)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter); // Apply to all API routes

app.use(express.json({ limit: '10kb' })); // Body limit
app.use(express.urlencoded({ extended: true }));

// Data Sanitization
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss()); // Prevent XSS
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/study', studyPlannerRoutes);

// Error handler
app.use(errorHandler);

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is undefined in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // Initialize public chat room
    try {
      const { initializePublicRoom } = require('./controllers/chatInitializer');
      await initializePublicRoom();
    } catch (chatError) {
      console.error('Chat Init Warning:', chatError.message);
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    // process.exit(1); // REMOVED: Do not exit in serverless environment
  }
};

// Root Route for Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Socket.io Setup (Enabled for all environments)
const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./sockets/socketHandler');

const server = http.createServer(app);

// Use the same origins as Express CORS but adapt for Socket.io format
// Socket.io expects an array or strings, regex is supported
const socketOrigins = [
  'http://localhost:5173',
  'https://hamaralakshay.vercel.app',
  'https://apnalakshay.com',
  'https://www.apnalakshay.com',
  /\.vercel\.app$/
];

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, ...socketOrigins] : socketOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Make io accessible to our routers
app.set('io', io);

// Initialize socket handlers
socketHandler(io);

// Start Server
connectDB().then(() => {
  // Only listen if we are in a runtime that expects it (not Vercel serverless export)
  // However, for Render/VPS we MUST listen.
  // Standard Node pattern:
  if (require.main === module || process.env.NODE_ENV === 'production') {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io enabled on port ${PORT}`);
    });
  }
});

module.exports = app;
