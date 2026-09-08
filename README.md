# Apna Lakshay Library - Production-Grade Library Management System

Live Production Deployment: https://apnalakshay.com

A full-stack, production-ready MERN enterprise suite engineered for modern offline libraries, study centers, and educational hubs. The system handles end-to-end operations including interactive multi-floor seat matrices, multi-shift student allocations, GPS-verified QR and biometric check-ins, automated billing cycles with partial payment tracking, role-based sub-admin delegation, and artificial intelligence-powered academic engines. Designed for scalability, high availability, and enterprise architectural standards.

---

## Master System Architecture and Enterprise Design

The Apna Lakshay LMS system is built with a decoupled, layered software architecture. Each layer handles a distinct operational responsibility, from client-side interface rendering to resilient data persistence and external service pipelines.

### Layer 1: Presentation Layer (Client Application)
- Framework: React 18 Single Page Application powered by Vite.
- Styling and Animation: Tailwind CSS with custom design tokens, CSS variables, and Framer Motion transitions.
- Client State Management: Centralized authentication context (AuthContext) with persistent localStorage synchronization and route guard protections.
- Specialized Components:
  - Interactive Multi-Floor Seating Canvas: Real-time desk occupancy visualization.
  - Digital 3D ID Card: Two-sided flip card with high-contrast zoomable barcode and SVG QR code rendering.
  - Pomodoro and Study Planner Suite: Time tracking, daily target setting, and personal checklists.
  - Public Seating Availability Board: Unauthenticated live desk view for prospective student inquiries.

### Layer 2: API Ingress and Security Gateway
- Routing Multiplexer: Express.js REST API router handling versioned endpoint dispatch.
- Authentication Guards: JSON Web Token (JWT) verification middleware with cryptographic signature checks. Standard session lifetimes for students and 365-day persistent tokens for designated sub-admin staff.
- Role-Based Access Control (RBAC): Hierarchical authorization layer enforcing Super Admin, Sub-Admin (with granular capability bitmasks), and Student scopes.
- Geofencing Verification: Haversine spherical distance calculation engine validating device GPS coordinates against library geographic coordinates prior to check-in acceptance.
- Real-Time Communication Broker: Socket.IO WebSocket server managing bidirectional event loops for live occupancy telemetry and online presence indicators.

### Layer 3: Controller and Business Logic Layer
- Decoupled Model-View-Controller (MVC) architecture separating HTTP transport from business logic.
- Authentication Controller: Seat-based login verification, credential management, password reset flows, and profile target hydration.
- Seat and Shift Controller: Conflict-free interval allocation logic, atomic seat transfers, multi-shift combinations, and room pricing calculations.
- Student Controller: Attendance metrics, fee ledger queries, personal analytics, and doubt session state management.
- Fee Controller: Automated billing cycle generation, partial and full settlement handling, cash transaction audits, and receipt generation.
- Sub-Admin Controller: Granular staff account provisioning, PIN-based access restrictions, and administrative action delegation.
- Engagement Controller: Study streak calculations, experience point (XP) algorithms, and active-student leaderboard generators.
- Settings Controller: Dynamic campus toggles, maintenance mode, geofencing enforcement, and doubt board launch policies.

### Layer 4: Data and Persistence Layer
- Database Engine: MongoDB Atlas with Mongoose Object Data Modeling (ODM).
- Schema Design:
  - User: Student credentials, contact information, role definitions, exam targets, and account status flags.
  - Seat: Floor identification, room assignments, physical desk numbering, and nested shift allocation subdocuments.
  - Shift: Shift names, start times, end times, and active capacity limits.
  - Fee: Billing cycles, total dues, amount paid, balance pending, settlement status, and transaction histories.
  - Attendance: Daily timestamps, check-in methods (QR, PIN, manual), verification coordinates, and duration counters.
  - StudyStreak: Consecutive study days, accumulated XP, activity dates, and weekly performance milestones.
  - DoubtSession: Subject categorization, conversation history, token counts, and language configurations.
  - MockTestAttempt: Exam metadata, question states, response logs, timing breakdowns, and final scorecards.
  - SystemSetting: Key-value configuration documents for application-wide policies and card layouts.
  - AIActivityLog: Audit logs of student interactions across all artificial intelligence tools.

### Layer 5: Caching and Acceleration Layer
- In-Memory Cache: Redis via the ioredis client for high-frequency read operations.
- Eviction Strategies: Automated key invalidation on database write operations (allocations, swaps, XP updates).
- Resilient Fallback: Built-in in-memory map store fallback if Redis connectivity is interrupted, ensuring zero downtime in standalone and offline environments.

### Layer 6: External Integration Pipelines
- Payment Gateway: Razorpay webhook and order integration with cryptographic signature verification for online fee settlements.
- Transactional Messaging: Brevo (formerly Sendinblue) SMTP and Nodemailer for automated HTML fee receipts and broadcast notices.
- Artificial Intelligence Pipeline: High-speed Groq API (Compound and Llama models) with automatic failover to Google Gemini API for uninterrupted academic support.

---

## Core Operational Workflows

### 1. GPS-Restricted QR and PIN Attendance Control Flow

Attendance integrity is enforced through a two-layer verification loop combining device geolocation validation and cryptographic token checks.

1. Handshake and Coordinate Acquisition:
   - When a student initiates a check-in, the client requests high-accuracy device geolocation coordinates using the browser Geolocation API.
   - Concurrently, the client retrieves the active student identifier and security token.
2. QR Code Generation and Ingress:
   - The student presents their digital ID card containing an encoded barcode and QR payload (prefixed with designated campus identifiers).
   - The scanning terminal or kiosk captures the payload and dispatches a secure POST request to the API gateway along with scanner coordinates.
3. Cryptographic and Geofencing Verification:
   - The gateway parses the student identifier and queries the database for the active student profile, assigned shift, and campus geofencing configuration.
   - The system executes the Haversine spherical distance calculation:
     d = 2 * R * asin(sqrt(sin^2((lat2 - lat1)/2) + cos(lat1) * cos(lat2) * sin^2((lon2 - lon1)/2)))
   - If the calculated distance exceeds the configured threshold (default: 15 meters), the transaction is rejected with a Location Violation response.
4. Time Window and State Upsert:
   - If geographic verification passes, the server checks the student's assigned shift time window.
   - The attendance controller creates or updates the daily Attendance document for the current calendar day in Indian Standard Time (IST).
   - The system updates the live attendance counter in Redis and emits a WebSocket event to update administrative dashboards in real time.
5. Offline PIN Fallback:
   - If student device camera or GPS capabilities are unavailable, authorized administrators can provide a daily rotating 4-8 digit attendance PIN, allowing validated manual check-in through the student dashboard.

### 2. Multi-Shift Seat Overlap Verification Flow

The library supports assigning a single physical desk to multiple students across distinct, non-overlapping time shifts. Conflicts are prevented via deterministic interval intersection logic.

1. Allocation Request:
   - An administrator selects a physical seat and one or more target shifts for a student.
2. Interval Intersection Check:
   - The controller retrieves all existing active assignments for the designated seat from the Seat collection.
   - For every existing assignment and requested assignment pair, the system computes interval overlap using normalized minutes from midnight:
     Overlap = max(0, min(EndA, EndB) - max(StartA, StartB))
   - If any pair returns an overlap greater than zero, the allocation is aborted with an HTTP 409 Conflict error specifying the conflicting time window.
3. Transactional Assignment and Pricing:
   - If zero conflicts exist, the assignments array is constructed.
   - Base seat pricing is applied to the primary shift, with discounted or zeroed rates for contiguous multi-shift bundles according to institutional policy.
   - The Seat document is updated atomically.
4. Financial Ledger Synchronization:
   - A Fee record is generated for the current billing cycle matching the calculated multi-shift total.
   - An email confirmation detailing shift hours and seat assignment is dispatched to the student.

### 3. Automated Fee Management and Ledger Lifecycle

Fee tracking supports enterprise multi-cycle billing, partial payments, and split administrative responsibilities.

1. Billing Cycle Anchoring:
   - Each student account is anchored to an admission date. Billing intervals generate recurring monthly or custom fee records.
2. Payment Collection:
   - Online settlements trigger via Razorpay integration with server-side signature validation.
   - Physical desk collections can be recorded by administrators and authorized sub-administrators.
3. Sub-Admin Ledger Restrictions:
   - Sub-administrators operate in a restricted fee management view:
     - Direct visibility limited to Pending Dues and Settled Paid tabs.
     - Access to single total pending dues metric without enterprise KPI leakage.
     - Search bars, inactive student filters, and receipt slip generators are suppressed.
     - Single-action Collect Fee modal for direct payment processing.
4. Super Admin Enterprise View:
   - Full KPI matrix: Total Fees Collected, Today Collections, Pending Dues Defaulters Count, Total Outstanding Amount.
   - Six comprehensive filter tabs: All Records, Paid, Pending, Expired, Inactive, and Advance.
   - Individual student payment history modal, printable thermal receipt slips, and custom PDF ledger exports.

---

## 20 Enterprise Admin Modules

The Super Admin dashboard provides a centralized management console comprising 20 enterprise modules organized into three operational categories.

### Library Operations (10 Modules)
1. Student Directory (/admin/students): Complete student roster, detailed profiles, seat assignments, status toggles, and document management.
2. Floor and Seat Matrix (/admin/floors): Visual grid editor for library floors, rooms, desk numbering, AC and Non-AC categorization, and pricing tiers.
3. Attendance Tracking (/admin/attendance): Daily check-in logs, biometric punches, manual attendance toggles, and date-filtered attendance registers.
4. Fee Management (/admin/fees): Complete financial ledger, billing cycles, partial payments, dues collection, and PDF receipts.
5. Shift Operations (/admin/shifts): Configuration of study shifts, batch timings, operational windows, and hourly quotas.
6. Vacant Seats (/admin/vacant-seats): Real-time vacancy matrix displaying unoccupied desks filtered by shift, room, and floor.
7. QR Entry Kiosk (/admin/kiosk): Full-screen entrance kiosk interface optimized for automated QR code scanning at front desks.
8. Notice and Announcements (/admin/notifications): Broadcast notice dispatch system delivering alerts directly to student dashboards.
9. Discussion Rooms (/admin/chat): Real-time academic chat spaces organized by competitive examination subjects.
10. Student Chat History (/admin/chat-history): Moderation panel and audit repository for artificial intelligence queries and student room discussions.

### Analytics and Insights (4 Modules)
11. Reports and Analytics (/admin/analytics): High-level operational dashboards, revenue charts, seat utilization curves, and student retention reports.
12. Student Activities and XP (/admin/activities): Gamification tracking displaying study streaks, focus hours, and student experience point leaderboards.
13. AI Study Logs (/admin/ai-activity): Telemetry and usage records across all artificial intelligence tools, tracking student engagement and credit consumption.
14. Referral and Wallet (/admin/referral-wallet): Campus referral system tracking reward balances, payout requests, and incentive coin distributions.

### Administration and Governance (6 Modules)
15. Sub-Admin Roles (/admin/sub-admins): Staff user provisioning, credential management, PIN assignments, and capability permissions.
16. Student Requests (/admin/requests): Workflow approval inbox for seat transfer requests, shift changes, and student feedback.
17. Action History Logs (/admin/history): Immutable audit log recording all administrative modifications, deletions, and operational updates.
18. Password Activity (/admin/password-activity): Security monitor tracking student credential resets, password modifications, and security events.
19. Manage Cards and Layout (/admin/manage-cards): Student application interface manager controlling card visibility, ordering, new badges, and AI credit quotas.
20. System Settings (/admin/settings): Global institutional controls including maintenance mode, geofencing enforcement, PIN attendance, and WhatsApp group links.

---

## Artificial Intelligence Academic Suite

The platform includes seven artificial intelligence features powered by Groq API (Compound and Llama 3.1 8B models) with automatic failover to Google Gemini.

### 1. Multi-Lingual AI Doubt Board
- Interactive doubt solver supporting English, Hindi, and Hinglish.
- Equipped with web-aware retrieval capabilities for current affairs, recent events, and contemporary general knowledge questions.
- Configurable auto-launch policy triggered upon successful attendance check-in.
- Daily credit allowance allocated dynamically based on student fee arrangements.

### 2. AI Study Plan Generator
- Generates structured multi-week daily schedules based on target examinations (UPSC, BPSC, SSC, Banking, Railway, JEE, NEET).
- Formulates daily study blocks, subject priorities, and designated rest days.

### 3. Mock Test Performance Analyzer
- Evaluates test scorecards section-by-section.
- Pinpoints weak subject areas, provides targeted explanations for incorrect responses, and generates a concrete three-day corrective study roadmap.

### 4. AI Notes Summarizer
- Condenses raw academic text (up to 4000 characters) into five bullet points, key facts, and three auto-generated multiple-choice questions with answer keys.

### 5. Current Affairs Quiz Generator
- Analyzes editorial and news article titles to generate three exam-style multiple-choice questions with rationale explanations.

### 6. Smart Task Suggestion Engine
- Reads the student database profile, current streak, and planned targets to suggest three actionable, time-estimated study tasks for the day.

### 7. Exam Readiness Score Calculator
- Computes an objective 0-100 readiness metric based on four weighted parameters:
  - Study Streak consistency (25 points max)
  - 30-day Attendance percentage (25 points max)
  - Recent Mock Test average score (30 points max)
  - Academic tool engagement (20 points max)

---

## Technical Implementations and Solved Engineering Challenges

### 1. Active Student Mapping in Leaderboard Queries
- Problem: Conventional engagement aggregations only queried existing streak records, omitting newly enrolled students without logs.
- Implementation: Re-engineered the engagement resolver to query the primary User collection for all active students, joining StudyStreak documents via left outer joins. Missing records default safely to Level 1, 0 XP, and 0 days, preventing pagination and sorting failures.

### 2. State Hydration and Target Configuration Persistence
- Problem: Partial payload returns during seat logins caused client state to reset customized examination targets to default values upon page refresh.
- Implementation: Updated the authentication controller to include complete profile objects (including explicit examTarget and remaining AI test credits) and added a hydration guard in AuthContext to preserve localized preferences.

### 3. Multi-Key Round-Robin AI Resilience Pipeline
- Problem: Strict rate limits on third-party AI endpoints during peak study hours resulted in service interruptions.
- Implementation: Constructed a dynamic key rotator that cycles through a pool of Groq API keys. Upon encountering an HTTP 429 response across all keys, requests automatically route to the Google Gemini API fallback pipeline, ensuring uninterrupted availability.

### 4. Mongoose Timestamp Lock Bypass for Backdated Records
- Problem: Standard Mongoose models with timestamps enabled overwrite createdAt values with system time on save, preventing backdated admission records.
- Implementation: Bypassed schema-level hooks using native MongoDB collection updates:
```javascript
await User.collection.updateOne(
    { _id: userId },
    { $set: { createdAt: new Date(backdatedAdmissionDate) } }
);
```

### 5. High-Performance Redis Caching with Resilient Fallback
- Problem: Heavy read traffic on public seating availability grids and vacancy endpoints placed excessive load on MongoDB.
- Implementation: Integrated an ioredis caching layer with short time-to-live (TTL) limits:
  - Leaderboards: 60-second TTL, invalidated on XP changes.
  - Vacant Seats: 30-second TTL, invalidated on seat allocation or transfer.
  - Public Seating Grid: 30-second TTL, invalidated on seat mutations.
  - Resilience: If Redis is unreachable, the system transparently defaults to an in-memory Map store, preventing application crashes.

### 6. Progressive Batch Question Loading for Examination Engines
- Problem: Generating 150 questions for comprehensive examination patterns (such as BPSC Prelims) simultaneously caused API timeouts and heavy client payload sizes.
- Implementation: Built a progressive batch loading system:
  - Parallel generation of sections in batches of 3.
  - Initial load of 5 questions per section.
  - Progressive retrieval of 5 additional questions as the student approaches the end of a section, strictly respecting quota weights.

---

## Technology Stack

| Architecture Layer | Technology | Specification and Usage |
|---|---|---|
| Frontend Framework | React.js (v18.x) | Single Page Application built with Vite |
| Styling Framework | Tailwind CSS | Utility-first CSS, custom design tokens, CSS variables |
| Client Animations | Framer Motion | Interface transitions and micro-interactions |
| Icons Library | React Icons (Ionicons 5) | Consistent, lightweight vector icons |
| Backend Runtime | Node.js (v18.x+) | Event-driven server runtime |
| Web Application Framework | Express.js (v4.x) | RESTful API routing, middleware, and controllers |
| Database Engine | MongoDB | Document database via Mongoose ODM |
| In-Memory Caching | Redis / ioredis | Fast key-value caching with memory fallback |
| Real-Time Communication | Socket.IO | Bidirectional WebSocket event communication |
| Authentication | JSON Web Tokens and bcrypt | Stateless token verification with salted hashing |
| Payment Gateway | Razorpay Node SDK | Online payment processing and webhook validation |
| Transactional Email | Brevo SMTP and Nodemailer | Automated HTML receipts and notification delivery |
| Artificial Intelligence | Groq API and Google Gemini | High-speed LLM processing with automated failover |

---

## Installation and Setup Guide

### Prerequisites
- Node.js version 18.0.0 or higher
- MongoDB instance (local server or MongoDB Atlas connection string)
- Redis instance (optional; system falls back to in-memory cache if omitted)
- Razorpay API credentials (for payment processing)
- Groq and Google Gemini API keys (for AI features)

### 1. Repository Clone and Dependency Installation

```bash
# Clone the repository
git clone https://github.com/himanshuraj108/Apna_Lakshay_LMS.git
cd Apna_Lakshay_LMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variable Configuration

Create a configuration file named .env in the backend/ directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/apna_lakshay_lms
JWT_SECRET=your_jwt_cryptographic_secret_key_here
JWT_EXPIRE=30d

# Primary Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_google_app_password
EMAIL_FROM_ADDRESS=noreply@apnalakshay.com

# Secondary Transactional Email (Brevo SMTP)
BREVO_HOST=smtp-relay.brevo.com
BREVO_PORT=587
BREVO_USER=your_brevo_username
BREVO_PASS=your_brevo_password

# Client and Host URLs
FRONTEND_URL=http://localhost:5173
APK_DOWNLOAD_URL=https://apnalakshay.com/download

# Default Administrator Account (Seed Setup)
ADMIN_EMAIL=admin@apnalakshay.com
ADMIN_PASSWORD=your_secure_admin_password

# Geofence Configuration (Library Campus Coordinates)
LIBRARY_LAT=26.5890
LIBRARY_LNG=85.5000
LIBRARY_RADIUS_M=15

# Payment Integration (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AI Engine API Keys
GROQ_API_KEY=your_primary_groq_api_key
GROQ_API_KEY_2=your_secondary_groq_api_key
GROQ_API_KEY_3=your_tertiary_groq_api_key
GEMINI_API_KEY=your_google_gemini_api_key

# Redis Caching (Optional - Prefix with rediss:// for TLS connections)
REDIS_URL=redis://localhost:6379
```

### 3. Database Seeding and Local Launch

```bash
# Seed default floors, shifts, and master admin account
cd backend
node scripts/seedData.js

# Launch the backend development server
npm start

# In a separate terminal, launch the frontend development client
cd ../frontend
npm run dev
```

- Backend API Endpoint: http://localhost:5000
- Frontend Web Interface: http://localhost:5173

---

## Production Deployment with PM2

For Linux VPS deployments (Ubuntu/Debian):

```bash
# Build the production frontend bundle
cd frontend
npm run build

# Start backend cluster with PM2 process manager
cd ../backend
pm2 start server.js --name "apna-lakshay-backend" -i max
pm2 save
pm2 startup
```

Configure Nginx as a reverse proxy to route port 80/443 traffic to the frontend distribution build and the /api route to port 5000.

---

## Default System Credentials

| Role | Identifier / Email | Password | Access Scope |
|---|---|---|---|
| Global Super Admin | admin | admin123 | Complete access to all 20 modules and settings |
| Seed Student Account | student@apnalakshay.com | Delivered via email | Student portal and study suite access |

Important: Default administrative credentials must be updated immediately upon initial deployment using the System Settings or Sub-Admin management panels.

---

## License and Governance

Proprietary Software - Apna Lakshay Library Management System.
All Rights Reserved 2026. Designed, engineered, and maintained for live enterprise library operations.
