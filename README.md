# Apna Lakshay — Library Management System

> Used by 100+ students across active reading libraries.

A full-stack, production-grade Library Management System designed for competitive exam coaching institutes and reading libraries. The platform manages seat allocation, student lifecycle, fee collection, attendance, AI-powered learning tools, and real-time operations through a role-based multi-tenant architecture.

---

## Overview

Apna Lakshay replaces manual library operations with a centralised digital platform. Super admins manage the entire institution. Sub-admins handle day-to-day floor operations. Students interact with a self-service portal covering seat bookings, fee status, study tools, and AI-assisted learning — all from a single authenticated session.

---

## Architecture

```
Client (React + Vite)
        |
        |  HTTPS / WSS
        v
API Server (Node.js + Express)
        |              |
   MongoDB Atlas    Redis (Upstash)
   (Primary DB)    (Session Cache)
        |
   Cloudinary (Media Storage)
   Razorpay   (Payment Gateway)
   Nodemailer (Transactional Email)
   Groq API   (AI / LLM Layer)
```

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Socket.io Client, KaTeX, jsPDF  
**Backend:** Node.js, Express.js, Socket.io, node-cron  
**Database:** MongoDB Atlas (Mongoose ODM)  
**Cache:** Redis via ioredis  
**Auth:** JWT (access + refresh token pattern), bcryptjs  
**Security:** Helmet, express-rate-limit, express-mongo-sanitize, xss-clean, HPP  
**Media:** Cloudinary (profile photos, uploaded notes)  
**Payments:** Razorpay payment gateway  
**AI:** Groq API (LLaMA, Compound, Qwen model family) with multi-model fallback chain  
**Email:** Nodemailer (SMTP)

---

## Roles and Access

| Role | Scope |
|------|-------|
| Super Admin | Full system access — student management, seats, fees, shifts, settings, analytics, sub-admin management |
| Sub Admin | Floor operations — attendance, seat check, student ID card printing, inactivation requests routed to super admin |
| Student | Self-service portal — dashboard, seat view, fees, AI tools, mock tests, discussion, doubt board, wallet |

---

## Feature Modules

### Seat and Floor Management

- Multi-floor, multi-room seat matrix
- Shift-based assignment (morning, afternoon, evening, full-day, custom)
- Shift overlap detection for all seat operations
- Temporary seat allocation when original seat is occupied
- Inactivation and reinstatement workflow with seat restoration and conflict resolution
- Vacant seat real-time matrix view
- QR Entry Kiosk — full-screen entrance scanner for attendance marking

### Student Lifecycle

- Admin-registered and self-registered student flows
- Aadhar number, date of birth, gender, address, locker number fields
- Student ID card generation with QR code (PDF export via jsPDF)
- Profile photo upload (Cloudinary)
- Archive and soft-delete with restoration support
- Status history log per student
- Sub-admin inactivation request routed to super admin with approval or disapproval
- Seat restoration on disapproval with conflict-aware relocation

### Attendance

- QR code scan-based daily check-in
- PIN-based attendance mode
- Location-bound attendance (geofence)
- Login-triggered attendance
- Attendance trend graphs and monthly report
- Absent tracking and daily log

### Fee Management

- Fee record creation, due tracking, and settlement
- Razorpay online payment integration
- Physical receipt generation (jsPDF + autotable)
- Pending dues dashboard for admin
- Per-student fee history and session ledger
- Admin referral wallet

### Shifts

- Configurable shifts with start time, end time, and quota
- Shift-level seat allocation enforcement
- Custom mode and legacy shift support

### AI Learning Suite (Student Portal)

| Tool | Description |
|------|-------------|
| Daily Challenge | AI-generated bilingual MCQ quiz (English + Hindi) via Groq; XP reward on completion |
| Mock Test Engine | Full MCQ test engine with timer, subject selection, bilingual support, detailed solution review |
| Doubt Board | Conversational AI doubt resolution with subject tagging, language selection (English, Hindi, Hinglish), pinned conversations, dark/light theme |
| AI Study Planner | Goal-based study plan generation for competitive exams |
| AI Note Summarizer | Upload or paste notes; AI returns structured summary |
| AI Readiness Score | Assesses exam readiness based on activity data |
| AI Task Suggestions | Recommends daily tasks based on study patterns |
| AI Test Analyzer | Analyses mock test performance and highlights weak areas |
| Current Affairs | AI-curated current affairs feed with quiz |
| Exam Alerts | Upcoming exam notifications and reminders |

### Engagement and Gamification

- Study streak tracking
- XP and coin reward system
- Pomodoro session tracker
- Daily challenge with bilingual language selector
- Monthly performance report
- Wallet with coin history and redemption

### Real-Time Features (Socket.io)

- Live seat status updates
- Discussion room (public chat)
- Real-time notifications
- Admin live dashboard metrics

### Notifications

- In-app notification centre per role
- Email notifications via Nodemailer (seat assignment, fee due, inactivation, approval)
- Push-style real-time alerts via Socket.io

### Admin Analytics

- Dashboard metrics: total seats, active students, daily check-ins, pending requests, pending dues, total revenue
- Attendance trend chart
- Shift distribution breakdown
- Floor occupancy heatmap
- Recent transactions panel
- AI-assisted admin query (natural language dashboard queries)
- AI Activity Logs and action audit trail

### Settings and Configuration

- System status toggle (maintenance mode)
- Location attendance toggle
- PIN attendance toggle
- Login attendance toggle
- WhatsApp group link
- AI tools visibility toggle
- Force doubt board mode
- Referral and reward configuration
- Online payment enable/disable

### Sub Admin Management

- Create and manage sub-admin accounts
- Permission scopes per sub-admin
- Sub-admin PIN guard for sensitive operations
- Sub-admin inactivation request workflow

---

## Project Structure

```
lms/
  backend/
    controllers/        Business logic (admin, student, auth, AI, fees, seats, etc.)
    models/             Mongoose schemas (32 models)
    routes/             Express route definitions
    middleware/         Auth guard, error handler, rate limiting
    services/           Email service
    utils/              Cron jobs, time utilities, action logger
    sockets/            Socket.io event handlers
    config/             Database and Redis connection
    scripts/            Seed scripts
    server.js           Application entry point

  frontend/
    src/
      pages/
        admin/          Super admin pages (23 pages)
        student/        Student portal pages (23 pages)
        common/         Shared pages
      components/
        admin/          Admin UI components (ShiftManager, QRScanner, IdCard, etc.)
        student/        Student UI components
        common/         Shared components (QuizTextFormatter, StructuredAIResponse, etc.)
      context/          AuthContext, ShiftContext
      utils/            API client, helpers
```

---

## Data Models

| Model | Purpose |
|-------|---------|
| User | Students, sub-admins, super admin |
| Seat | Seat assignments per shift with active/expired/temporary status |
| TempSeatAssignment | Temporary seat allocation records |
| Shift | Shift definitions and time windows |
| Floor / Room | Physical library layout |
| Fee | Fee records, payment status, transaction history |
| Attendance | Daily check-in records |
| Request | Seat change, shift change, inactivation requests |
| Notification | Per-user in-app notifications |
| DailyQuiz / DailyQuizAttempt | AI-generated quiz with bilingual fields |
| MockTestAttempt | Mock test sessions and answer records |
| DoubtSession | AI doubt conversation threads |
| StudyTask | Daily task list per student |
| PomodoroSession | Focus session records |
| StudyStreak | Streak tracking per student |
| CoinTransaction | Gamification coin ledger |
| Referral | Referral tracking |
| ChatRoom / Message | Public discussion room |
| ActionLog | Admin audit trail |
| AIActivityLog | AI query and response logs |
| Settings | Global system configuration |
| SubAdmin | Sub-admin extended profile |
| ArchivedStudent | Soft-deleted student records |
| Holiday | Library holiday calendar |

---

## Security

- JWT authentication with HTTP-only cookie support
- Helmet security headers on all responses
- Rate limiting: 1000 requests per 15 minutes per IP on all API routes
- MongoDB query sanitization (express-mongo-sanitize)
- XSS input sanitization (xss-clean)
- HTTP Parameter Pollution prevention (HPP)
- Role-based route guards on all protected endpoints
- Sub-admin PIN guard for destructive operations
- CORS restricted to whitelisted origins

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=

# Database
MONGODB_URI=

# Authentication
JWT_SECRET=
JWT_EXPIRE=

# Primary Email (Gmail App Password)
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM_ADDRESS=

# Backup Email (Brevo SMTP)
BREVO_HOST=
BREVO_PORT=
BREVO_USER=
BREVO_PASS=

# Frontend URL (used for CORS and email links)
FRONTEND_URL=

# Admin Seed Credentials
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Cloudinary (media storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Groq AI (primary and fallback keys)
GROQ_API_KEY=
GROQ_API_KEY_2=
GROQ_API_KEY_3=

# Razorpay (payment gateway)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Redis (cache layer)
REDIS_URL=

# Library Geofence (for location-based attendance)
LIBRARY_LAT=
LIBRARY_LNG=
LIBRARY_RADIUS_M=

# External APIs
RSS2JSON_KEY=
GOOGLE_BOOKS_API_KEY=

# App download link (optional, shown to mobile users)
APK_DOWNLOAD_URL=
```

### Frontend (`frontend/.env`)

```env
# Backend API base URL
VITE_API_URL=

# Razorpay public key (same key as backend RAZORPAY_KEY_ID)
VITE_RAZORPAY_KEY_ID=

# Google Maps link for library location shown to students
VITE_LIBRARY_LOCATION_URL=

# WhatsApp group invite link (shown in student portal if enabled)
VITE_WHATSAPP_GROUP_URL=
```

---

## Local Development

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas cluster (or local MongoDB)
- Redis instance (Upstash free tier or local)
- Cloudinary account
- Groq API key

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in all variables
npm run dev            # starts with nodemon on port 5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev            # starts Vite dev server on port 5173
```

---

## Deployment

### Backend (Render / Railway / Fly.io)

The server is configured for any Node.js hosting provider. Key points:

- `server.js` binds to `0.0.0.0` and reads `PORT` from the environment.
- `trust proxy` is enabled for providers that terminate TLS upstream.
- A `Dockerfile` is included for container-based deployments.
- A `vercel.json` is included for Vercel serverless deployment (functions mode).

### Frontend (Vercel)

```bash
cd frontend
npm run build          # outputs to dist/
```

Deploy the `dist/` directory to Vercel, Netlify, or any static host. Set `VITE_API_URL` to your backend URL before building.

---

## Cron Jobs

The following scheduled tasks run automatically on server start:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Daily quiz generation | Daily | Generates AI MCQ for each active exam category |
| Fee due reminders | Daily | Emails students with overdue fees |
| Streak reset | Daily | Resets inactive study streaks |
| Temporary seat expiry | Hourly | Expires overdue temp seat assignments |
| Attendance summary | Daily | Computes and stores daily attendance totals |

---

## API Structure

All API routes are prefixed with `/api`.

| Prefix | Module |
|--------|--------|
| /api/auth | Login, register, forgot password, token refresh |
| /api/admin | All super admin and sub-admin operations |
| /api/student | All student self-service operations |
| /api/public | Public endpoints (landing page data) |
| /api/settings | System settings read and update |
| /api/chat | Discussion room messages |
| /api/study | Study planner operations |

---

## License

This project is proprietary software. All rights reserved. Unauthorised copying, distribution, or modification is prohibited.
