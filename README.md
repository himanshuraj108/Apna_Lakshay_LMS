# Apna Lakshay -- Production-Grade Library Management System

[![Production Ready](https://img.shields.io/badge/Status-Production--Ready-success.svg?style=flat-for-the-badge)](https://apnalakshay.com)
[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg?style=flat-for-the-badge)](https://mongodb.com)
[![Deployment](https://img.shields.io/badge/Deployment-VPS%20%7C%20PM2-purple.svg?style=flat-for-the-badge)](https://pm2.keymetrics.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-for-the-badge)](https://apnalakshay.com)

**Live Production System:** [https://apnalakshay.com](https://apnalakshay.com)

A premium, full-stack, production-ready MERN enterprise suite engineered for modern offline libraries. The system handles end-to-end operations including interactive seat booking grids, multi-shift allocations, location-verified QR check-ins, automated billing cycles with partial payment tracking, and AI-powered academic engines. Built for scale, high reliability, and elite UI/UX standards, this codebase is designed according to enterprise software architecture best practices.

---

## Master System Architecture & Enterprise Design Blueprint

The entire Apna Lakshay LMS system is designed with a highly decoupled, layered architecture. The client interface communicates with a secured Express API gateway layer, driving specialized controller logic that acts as the core database state machine. Third-party gateways are integrated with reliable resilience pipelines, including an AI rate-limit fallback loop.

```mermaid
graph TB
    %% Styling Configurations
    classDef clientStyle fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef gatewayStyle fill:#fdf4ff,stroke:#c084fc,stroke-width:2px,color:#86198f;
    classDef controlStyle fill:#fef9c3,stroke:#eab308,stroke-width:2px,color:#854d0e;
    classDef modelStyle fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#166534;
    classDef externStyle fill:#fff1f2,stroke:#f43f5e,stroke-width:2px,color:#9f1239;

    subgraph ClientSPA ["Presentation Layer (React SPA App)"]
        Dashboards["Student & Admin Dashboards (Framer Motion, Tailwind)"]:::clientStyle
        AuthCtx["AuthContext Hook (State Persistence Core)"]:::clientStyle
        IDCard["3D Flip Digital ID Card (Rules Panel & Zoomable QR SVG)"]:::clientStyle
        TimerPomodoro["Pomodoro Timer & Study Planner Tools"]:::clientStyle
        PublicGrid["Public Room Seating Availability Board"]:::clientStyle
    end

    subgraph RouterIngress ["API Ingress & Session Security Guard (Express Gateway)"]
        RouteMux["API Router Routing Multiplexer"]:::gatewayStyle
        JWTGuard["JWT Token Verification & Session Expiration (365-day Sub-Admins)"]:::gatewayStyle
        RoleScope["Role Authorization Guard (Admin vs Sub-Admin permissions vs Student)"]:::gatewayStyle
        GeoFencing["GPS Geofencing Guard (Haversine Spherical Formula)"]:::gatewayStyle
        SocketBroker["Socket.IO Bidirectional Live Web Socket Broker"]:::gatewayStyle
    end

    subgraph CoreControllers ["Core Logic & Service Controllers (Decoupled MVC backend)"]
        authController["authController (verifySeatLogin, target persistence)"]:::controlStyle
        engagementController["engagementController (Active student leaderboard, streak XP calculator)"]:::controlStyle
        seatController["seatController (Multi-shift overlap checker, atomic seat swaps)"]:::controlStyle
        studentController["studentController (Attendance metrics, fee checks, review solvers)"]:::controlStyle
        adminController["adminController (Backdated Join updates, student registers CRUD)"]:::controlStyle
    end

    subgraph DatabaseLayer ["Data Layer (Mongoose ODM / MongoDB Atlas)"]
        UserModel[("User Collection (credentials, roles, examTarget)")]:::modelStyle
        SeatModel[("Seat Collection (floor, room, assignments subdocuments)")]:::modelStyle
        ShiftModel[("Shift Collection (custom names, time ranges)")]:::modelStyle
        FeeModel[("Fee Collection (billing cycles, partial statuses)")]:::modelStyle
        AttModel[("Attendance Collection (daily check-in sessions)")]:::modelStyle
        StreakModel[("StudyStreak Collection (XP levels, consecutive days)")]:::modelStyle
        DoubtModel[("DoubtSession Collection (subject-aware chat logs)")]:::modelStyle
        MockModel[("MockTestAttempt Collection (exam templates, review scorecards)")]:::modelStyle
    end

    subgraph Integrations ["Third-Party Service Pipelines"]
        RazorpayGate["Razorpay Gateway (Order creation, hash signature checks)"]:::externStyle
        SMTPTransactor["Brevo SMTP / Nodemailer (Transactional HTML receipts & broadcasts)"]:::externStyle
        groqGeminiPipeline["Groq-Gemini AI Pipe (Groq Key Rotator -> Llama 3.1 8B -> Gemini Fallback Engine)"]:::externStyle
    end

    %% Routing Ingress Connections
    Dashboards -->|REST HTTPS Requests| RouteMux
    IDCard -->|Barcode Check-In Trigger| RouteMux
    TimerPomodoro -->|Log Engagement Metrics| RouteMux
    PublicGrid -->|Unauthenticated Seats Sync| RouteMux
    SocketBroker <-->|Live Connection Handshake| Dashboards

    %% Gateway to Controllers
    RouteMux --> JWTGuard
    JWTGuard --> RoleScope
    RoleScope --> GeoFencing
    GeoFencing --> authController
    GeoFencing --> engagementController
    GeoFencing --> seatController
    GeoFencing --> studentController
    GeoFencing --> adminController

    %% Controllers to Models (Read/Write)
    authController <--> UserModel
    engagementController <--> StreakModel
    engagementController <--> UserModel
    seatController <--> SeatModel
    seatController <--> ShiftModel
    studentController <--> AttModel
    studentController <--> FeeModel
    adminController <--> UserModel
    adminController <--> SeatModel
    adminController <--> FeeModel

    %% Models Cross Relations
    UserModel -->|Assigned Shift | ShiftModel
    SeatModel -->|Subdocument Array| UserModel
    FeeModel -->|Billing Anchor Date| UserModel
    StreakModel -->|Engagement Score| UserModel
    DoubtModel -->|Subject Logs| UserModel
    MockModel -->|Review Sets| UserModel

    %% Controllers to Integrations
    studentController <--> RazorpayGate
    adminController --> SMTPTransactor
    studentController --> SMTPTransactor
    studentController <--> groqGeminiPipeline
```

---

## GPS-Restricted QR Attendance Control Flow

Attendance integrity is enforced via a two-layer control loop: cryptographic token verification and geographic distance validation within a 15-meter radius, using highly precise spherical geodesy (Haversine formula).

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Mobile / Client)
    actor Scanner as Library Barcode / QR Scanner
    participant Gateway as Express Backend Router
    participant DB as MongoDB Atlas
    
    Note over Student, DB: Step 1: Secure Handshake & Local GPS Lock
    Student->>Student: Get High-Accuracy GPS Coordinates
    Student->>Student: Generate Instant QR (Token + ID)
    Student->>Scanner: Scan QR Code (AL- prefix decode)
    
    Note over Scanner, Gateway: Step 2: Payload Extraction & Cryptographic Check
    Scanner->>Gateway: API Call with QR Payload & Device GPS
    Gateway->>Gateway: Parse Student Code (Filters "AL-" / "HL-" Barcode prefixes)
    Gateway->>DB: Fetch Active Session Token & Geofence Settings
    DB-->>Gateway: Active Member Token & Library GPS Coordinates
    
    Note over Gateway, DB: Step 3: Geographic Boundary & Time Validation
    Gateway->>Gateway: Compute Distance (Haversine Matrix Check)
    alt Distance > Allowed Geofence Radius (e.g. 15m)
        Gateway-->>Student: Reject Access (Location Violation Event)
    else Distance <= Allowed Geofence Radius
        Gateway->>Gateway: Resolve IST Timezone Boundaries
        Gateway->>DB: Upsert Attendance Record (Atomic check-in state)
        DB-->>Gateway: Successful Check-in Acknowledge
        Gateway-->>Student: Approve Entry (Access Granted Sound Played)
    end
```

---

## Multi-Shift Seat Overlap Verification Flow

Seats can be allocated to multiple students over distinct, non-overlapping time shifts. Conflicts are prevented via a deterministic interval overlap matrix prior to insertion.

```mermaid
graph TD
    classDef proc fill:#f1f5f9,stroke:#64748b,stroke-dasharray: 5 5;
    classDef decision fill:#ffedd5,stroke:#ea580c;
    classDef endPoint fill:#f0fdf4,stroke:#16a34a;
    classDef errPoint fill:#fef2f2,stroke:#dc2626;

    A[Admin Initiates Multi-Shift Allocation] --> B[Fetch Selected Seat & Desired Shifts Array]
    B --> C[Retrieve All Existing Active Assignments for Selected Seat]:::proc
    C --> D{Evaluate Shift Overlaps:<br>doTimeRangesOverlap startA, endA, startB, endB}:::decision
    
    D -->|True: Intersecting Slots Found| E[Return Conflict Error: Seat Occupied during Time Windows]:::errPoint
    D -->|False: Zero Conflicts| F[Construct Transactional Assignments Object Array]:::proc
    
    F --> G[Assign Price to the First Shift Block, Zero-Out Secondary Shifts]:::proc
    G --> H[Update Seat via MongoDB collection.updateOne Bypass timestamps]:::proc
    H --> I[Generate Single Fee Record for Combined Shift Price]:::proc
    I --> J[Success Broadcast Email Details to Student]:::endPoint
```

---

## Technical Implementations & Production Details

This codebase solves critical enterprise-level challenges through resilient architectural decisions:

### 1. Robust Leaderboard Logic (Active Student Mapping)
* **Problem**: Traditional engagement trackers only query streak documents. Newly registered students who do not yet have an active study log are completely left out of leaderboard views.
* **Solution**: Re-implemented the engagement resolver to query the primary `User` collection directly for all active, non-disabled student profiles. The engine then populates corresponding `StudyStreak` documents on the fly. Missing values default to Level 1, 0 XP, 0 streak days, and 0 focus hours safely—preventing frontend ranking pagination failures.

### 2. Reliable Context Persistence (Preventing Target Reset)
* **Problem**: Incomplete backend payload returns during seat logins caused the frontend `AuthContext` to overwrite the local cache, resetting custom `examTarget` configurations to "generic" on page refresh.
* **Solution**: Refactored `verifySeatLogin` in the authentication controller to include complete profile objects (including explicit `examTarget` and outstanding test credits). Complemented this with a state fallback pipeline in the frontend context to prevent hydration race conditions.

### 3. Date-Locked Multi-Key Round-Robin AI Pipeline
* **Problem**: Severe rate-limiting during high-concurrency exam preparation periods.
* **Solution**: Engineered a dynamic API scheduler that rotates requests among a stack of active Groq keys. If the entire Groq stack triggers an HTTP 429 (Rate Limit), a fallback exception catcher shifts the traffic dynamically to Google Gemini API, ensuring zero student downtime.

### 4. Mongoose Timestamp Override Bypass
* **Problem**: Setting `timestamps: true` in Mongoose models locks the `createdAt` and `updatedAt` properties, making backdated admissions impossible to persist since `.save()` overwrites the inputs with the system time.
* **Solution**: Bypassed Mongoose schema locks using a native MongoDB driver update:
  ```js
  await User.collection.updateOne(
      { _id: userId },
      { $set: { createdAt: new Date(backdatedAdmissionDate) } }
  );
  ```

---

## Technology Stack

| Layer | Technology | Production Detail |
|---|---|---|
| **Frontend** | React.js (Vite Core) | SPA, Client-side routing, high-performance bundling |
| **Styling** | Tailwind CSS & Vanilla CSS | Dynamic Tailwind layers, HSL-themed UI tokens, Glassmorphism |
| **Animations** | Framer Motion | Smooth dashboard transitions, modular micro-animations |
| **Backend** | Node.js, Express.js | Structured controller-route MVC architecture |
| **Database** | MongoDB (Mongoose ODM) | Document storage, deep subdocument embedding for seats |
| **Real-time** | Socket.IO | High-concurrency bidirectional event loops for online status |
| **Security** | JWT (JSON Web Tokens) & bcrypt | Cryptographic session tokens, salt-hashed authorization |
| **Payments** | Razorpay Gateways | Direct webhook integration, secure online invoice settlements |
| **Mailing** | Brevo SMTP / Nodemailer | E-Commerce-style responsive HTML transacting templates |
| **AI Processing** | Groq & Gemini Pipelines | Intelligent syllabi mock generator, active chat sessions |

---

## Quick Start Guide

### Prerequisites
* **Node.js** v18.0.0 or higher
* **MongoDB** instance running locally on `mongodb://localhost:27017` or a MongoDB Atlas Cloud URI
* **Razorpay Key Credentials** (Merchant account details for Sandbox testing)
* **Groq API Cloud Key(s)** and **Google Gemini API Key**

### 1. Installation Blueprint

```bash
# Clone the repository
git clone https://github.com/himanshuraj108/Apna_Lakshay_LMS.git
cd Apna_Lakshay_LMS

# Install Backend Node Modules
cd backend
npm install

# Install Frontend Node Modules
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a secure configuration file `backend/.env`:
```env
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRE=

# Email Configuration (Google App Password)
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM_ADDRESS=

# Backup Email Configuration (Brevo SMTP)
BREVO_HOST=
BREVO_PORT=
BREVO_USER=
BREVO_PASS=

# App Download Link (for mobile users)
APK_DOWNLOAD_URL=

# Frontend URL (for CORS)
FRONTEND_URL=
# Admin Credentials (for seed and fallback)
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# RSS2JSON API Key (for Exam Alerts feed)
RSS2JSON_KEY=

# Google Books API Key
GOOGLE_BOOKS_API_KEY=

# Groq AI API Key (Mock Test -- Free, Fast Llama 3)
GROQ_API_KEY=
GROQ_API_KEY_2=
GROQ_API_KEY_3=

# Library Geolocation (for attendance geo-fence)
LIBRARY_LAT=
LIBRARY_LNG=
LIBRARY_RADIUS_M=

# Payment Integrations
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### 3. Database Seeding & Launch

```bash
# Seed the initial floors, custom shifts, and default admin credentials
cd ../backend
node scripts/seedData.js

# Launch Backend Engine
npm start

# In a new terminal: Launch Frontend Client
cd ../frontend
npm run dev
```

* **Backend Gateway:** `http://localhost:5000`
* **Frontend Web App:** `http://localhost:5173`

---

## Default Credentials Matrix

| System Role | Username / E-Mail Address | Secret Password |
|---|---|---|
| **Global Admin** | `admin` | `admin123` |
| **Demo Student** | `student@apnalakshay.com` | Generated & sent via SMTP mailer during creation |

---

## Production-Grade Features List

### Enterprise Admin Suite
* **Real-time Analytics Desk**: Track operational capacities, current seated volume, active online logs via web sockets, and payment pipelines.
* **Granular Student Management**: Fully operational CRUD console including status deactivation, custom profile photos, and backdated admissions.
* **Dynamic Geofenced Attendance**: Manual check-in overrides, instant barcode scanning processing, automated daily report builders, and Excel/PDF generators.
* **Flexible Seat Configuration**: Multi-floor visual map builder allowing AC/Non-AC tagging, granular seat status views, and instant seat-swaps preserving pricing rules.
* **Advanced Fee Invoicing**: Multi-shift balance split, customizable partial payment entries with colored highlights, and global payment gate toggle overrides.

### Premium Student Experience
* **Double-Sided Digital ID Card**: Beautiful sliding glassmorphic card equipped with:
  * **3D Flip Interaction**: Flips seamlessly on tap to display active rules, streak boosters, and rewards systems.
  * **QR Code Zoom Overlays**: Responsive barcode modal zoom optimized for high-speed scanner terminal decoding.
* **Monthly Attendance Calendar & Rankings**: Visual present/absent color grids accompanied by inclusive leaderboard rankings, highlighting the student with custom themes.
* **Interactive AI Doubt Assistant**: Conversational session engine pre-programmed with specific civil service and government examination syllabi.
* **Mock Test Generator**: Instant adaptive tests with standard negative-marking mechanisms, saved progress records, and dynamic scorecard breakdowns.
* **Built-in Study Tools**: High-fidelity Pomodoro timers, collaborative study streak rewards, and editable checklist boards.

---

## Complete Architecture Changelog

### v3.0.0 -- Leaderboard Resiliency, Persistent Auth Contexts & Zoomable QR Cards (May 2026)
* **Inclusive Engagement Leaderboards**: Updated engagement queries to list all registered students, gracefully defaulting absent StudyStreak entries to basic stats (Level 1, 0 XP) rather than omitting students without database documents.
* **Exam Target Hydration**: Integrated target persistence in the seat login controller and React authentication hooks. Resolves standard page reload hydration issues, securing state consistency.
* **Multi-Prefix Barcode Parsing**: Enhanced scanner input parsing logic to seamlessly resolve both AL- and HL- student card prefixes on check-in.
* **Double-Sided 3D Card Animations**: Rolled out absolute CSS 3D transform layers for profile student cards, featuring interactive flip states with rules content on the back.
* **High-Contrast QR Modal**: Integrated full-view overlay zooms with SVG renderers for seamless scanner check-ins.

### v2.5.0 -- Sub-Admin Permissions, Login Expiration & Seat Swap Enhancements (May 2026)
* **Sub-Admin ID Access**: Added specific id-card privileges to sub-admin configurations.
* **Ultra-Extended Sessions**: Extended JWT expiration parameters for secondary admin endpoints to 365 days, mitigating daily session timeouts.
* **Atomic Seat Swap Controller**: Created transactional seat swap endpoints, ensuring all seat types, negotiated fee configurations, and shift dates transfer concurrently.
* **Mobile ID Layout Polish**: Wrapped layout sections in ID components to prevent typography overflowing.

### v2.4.0 -- Unified Settings & PIN Attendance (May 2026)
* **FAB Pulse Contexts**: Refactored dashboard entry structures to display responsive, pulsing check-in actions.
* **Offline PIN Fallback**: Configured keypads to allow local pin code authentication when GPS signal boundaries fail.
* **Dynamic Global Toggles**: Unified settings into a clean dropdown control block on the admin panel.

### v2.1.0 -- Partial Billing & Razorpay Sandbox (Apr 2026)
* **Dynamic Balances**: Integrated orange partial-payment statuses, tracking outstanding amounts per billing cycle.
* **E-Mail Receipts**: Upgraded Nodemailer actions to automatically deliver responsive HTML receipts upon full or partial settlement.

---

## Engineering Core

* **Lead Architect:** [Himanshu Raj](https://github.com/himanshuraj108)
* **Enterprise License:** Proprietary -- All Rights Reserved. Used in live production daily.
