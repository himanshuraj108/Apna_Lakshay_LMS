# Apna Lakshay — Library Management System

**Live:** https://apnalakshay.com

A production-ready, full-stack MERN web application for offline library seat booking, digital attendance, fee management, and AI-powered academic support. Currently live and used by 100+ students daily.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt |
| **Email** | Nodemailer (Google App Password + Brevo SMTP) |
| **Payments** | Razorpay (online fee collection) |
| **AI** | Groq API (Llama 3.1 8B) + Google Gemini API |
| **Real-time** | Socket.IO |
| **QR Code** | qrcode.react + GPS verification |
| **PDF** | jsPDF (receipts, reports, ID cards) |

---

## Quick Start

### Prerequisites

- Node.js v16 or higher
- MongoDB running on `localhost:27017`
- Google App Password for email notifications
- Razorpay account (for online payments)
- Groq API key (for AI features)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/himanshuraj108/Apna_Lakshay_LMS.git
cd Apna_Lakshay_LMS
```

**2. Install Backend dependencies**
```bash
cd backend
npm install
```

**3. Install Frontend dependencies**
```bash
cd ../frontend
npm install
```

**4. Configure Environment Variables**

Create `backend/.env`:
```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
APK_DOWNLOAD_URL=
BREVO_HOST=
BREVO_PASS=
BREVO_PORT=
BREVO_USER=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
EMAIL_FROM_ADDRESS=
EMAIL_PASSWORD=
EMAIL_USER=
FRONTEND_URL=
GOOGLE_BOOKS_API_KEY=
GROQ_API_KEY=
GROQ_API_KEY_2=
GROQ_API_KEY_3=
JWT_EXPIRE=
JWT_SECRET=
LIBRARY_LAT=
LIBRARY_LNG=
LIBRARY_RADIUS_M=
MONGODB_URI=
PORT=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RSS2JSON_KEY=
```

### Seed Database

```bash
cd backend
node scripts/seedData.js
```

This creates:
- Admin user (`email: admin`, `password: admin123`)
- Ground Floor: 1 Room, 20 Seats
- First Floor: 2 Rooms (7 + 12 seats)
- Second Floor: 1 Room, 5 Seats
- **Total: 40 Seats**

### Run Application

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```
Backend runs on: `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Student | Created by admin via email | Sent via email |

---

## Features

### Admin Features

#### Dashboard & Analytics
- Real-time stats: total students, occupied seats, fees collected, pending requests
- Peak hours graph (attendance by time slot)
- Recent activity feed
- Online student indicators (Socket.IO)

#### Student Management
- Full CRUD: create, edit, deactivate, permanently delete students
- Backdated admission date support — enter any past date as the join date
- Admission date correctly determines fee billing cycle (e.g., joined Apr 30 → Apr cycle, not May)
- Show/hide inactive students toggle (default: hidden, clean workspace)
- Student ID card generator with QR code (PDF export)
- Profile image management
- Password reset (manual entry or auto-set to mobile number)
- AI credit management (manual or auto-calculated from fee amount)
- View individual student's AI chat history

#### Seat Management
- Floor → Room → Seat hierarchy
- Dynamic room creation with seat count
- Seat availability with visual room grid
- **Multi-shift seat assignment**: assign a student to multiple non-overlapping shifts (e.g., Shift 1 AND Shift 3 on the same seat)
- Time-based overlap detection: prevents double-booking the same seat at the same time
- Negotiated price per student per shift (or total for multi-shift)
- Seat swap between two students
- Seat vacancy public view (no login required)

#### Shift Management
- Create custom shifts with name, start time, and end time (e.g., `Morning 6:00–12:00`)
- Update and deactivate shifts
- All shifts pulled dynamically from database — nothing hardcoded
- Shifts displayed with time ranges in the ID card for each student

#### Attendance
- Daily attendance marking with QR code scan + GPS verification
- Manual attendance override by admin
- Holiday marking
- Monthly attendance reports per student
- Download attendance report as PDF

#### Fee Management
- Mark fee as **fully paid** → email receipt sent
- Mark fee as **partially paid** → shows paid amount + outstanding balance in orange
- Outstanding balance tracked per student
- **Bulk fee update** across multiple students with configurable increase/decrease
- Download fee report (PDF) with full history
- **Online payment toggle**: enable or disable Razorpay for students globally with one switch
- Show/hide inactive students in fee table

#### Notifications & Announcements
- Send global announcements (all students)
- Send individual targeted notifications
- Notification types: seat, fee, announcement, request

#### Requests & Approvals
- Students submit change requests (seat, shift, profile)
- Admin approves or rejects with comments
- Email sent on approval/rejection

---

### Student Features

#### Dashboard
- Seat card: seat number, floor, room, AC/Non-AC badge, shift(s) with time
- Attendance card: present days, percentage, rank in class
- Fee card: status badge (paid/pending/overdue/partial), amount, due date
- Notification card: unread count, latest message
- Online payment reminder modal (if fee pending and Razorpay enabled)

#### Seat View
- Visual room grid with own seat highlighted in purple
- Floor/room selector
- Shows all occupied shifts on each seat

#### Attendance
- Monthly attendance log (present/absent/holiday per day)
- Attendance percentage chart
- **Rankings table**: all students ranked by attendance percentage
  - Top-5 students highlighted with green achievement background
  - Tied ranks both highlighted (inclusive tie-handling)
  - Own name highlighted in blue for easy identification
  - Gold/silver/bronze colored rank labels (no emojis)

#### Fee Status & History
- Full fee history (all months)
- Status badges: `Paid` (green), `Pending` (yellow), `Overdue` (red), `Partial` (orange)
- Partial payment breakdown: shows Paid, Outstanding, Total
- **Pay Online** button (shown only when admin enables Razorpay)
- Download payment receipt (PDF)
- Billing cycle: `Apr 30 – May 29` format based on join date

#### AI Doubt Board
- Ask subject-specific academic questions
- Subjects: Maths, Science, History, Polity, Economy, Geography, Current Affairs, English
- Powered by **Groq API (Llama 3.1 8B)**
- Multi-key round-robin rotation across multiple Groq API keys
- **Fallback chain**: Groq → Gemini on rate limit
- Per-student daily credit limit
- Session history saved

#### AI Mock Test Generator
- Generates exam-pattern MCQ tests dynamically
- Exams supported: SSC CGL, SSC CHSL, SSC GD, UPSC Prelims, Railway, Banking
- Section-wise syllabus awareness
- Negative marking support
- Multi-model fallback (Groq → Gemini)
- Test attempts saved and reviewable

#### Study Tools
- Study planner / to-do list with deadline tracking
- Pomodoro session timer
- Study streak tracking

#### Profile
- Upload profile photo
- Change mobile number, address
- Submit change requests for seat/shift

---

### Public Features (No Login Required)

- View seat availability by floor/room
- See which seats are free, partially booked, or fully booked
- Available seats show prices; occupied seats show "Occupied"
- Mobile-optimized with modal: "Download App" / "Continue in Browser"

---

## Multi-Shift Assignment

A student can be assigned to multiple shifts on the same seat (e.g., Shift 1 from 6:00–12:00 AND Shift 3 from 18:00–22:00).

### How it works

1. Admin opens **Assign Seat** modal for a student
2. Selects a seat from the dropdown
3. The shift selector shows **checkboxes** for all available (non-conflicting) shifts
4. Admin checks multiple shifts (e.g., Shift 1 ✓, Shift 3 ✓)
5. Optionally enters a combined negotiated price
6. Submits → backend creates one assignment entry per shift
7. Fee record created with the total combined price

### ID Card display

```
Shift        Shift 1
             06:00–12:00
             Shift 3
             18:00–22:00
```

### Seat availability logic

- A seat slot is marked occupied only for the specific shift time window
- Other time windows remain available for other students
- Full-day assignment blocks all windows

---

## Email System

All emails use premium branded HTML templates with the Apna Lakshay identity.

| Trigger | Email Sent |
|---|---|
| Student account created | Login credentials |
| Seat assigned | Seat details + shift(s) |
| Fee fully paid | Payment receipt |
| Fee partially paid | Paid amount, Outstanding, Total |
| Bulk fee update | Old fee vs New fee comparison |
| Fee reminder (5 days before due) | Reminder with due date |
| Request approved | Approval confirmation |
| Request rejected | Rejection with reason |
| Admin announcement | Broadcast message |

---

## Fee Billing Cycle Logic

The fee cycle is anchored to the student's **admission date** (not the current date).

| Admission Date | First Fee Cycle | Due Date |
|---|---|---|
| Apr 30 | Apr 30 – May 29 | Apr 30 |
| May 15 | May 15 – Jun 14 | May 15 |
| Jan 1 | Jan 1 – Jan 31 | Jan 1 |

If a student is added with a backdated admission (e.g., admin adds them today but sets join date to Apr 30), the first fee is correctly created for the **April cycle**, not the current month.

---

## Admission Date Update Fix

Mongoose's `timestamps: true` silently blocks `createdAt` changes via `.save()`. The admin update uses a raw MongoDB `collection.updateOne` with `$set` to bypass this and force-write the new admission date to the database.

---

## UI/UX Highlights

- **Premium dark theme** with purple-to-pink gradients
- **Glassmorphism cards** with frosted glass effect
- **Framer Motion** micro-animations on all pages
- **Skeleton loaders** for all async data (no spinners)
- **Color-coded statuses**:
  -  Green: Available / Paid / Present / Top-5 Attendance
  -  Red: Occupied / Overdue / Absent / Inactive
  -  Yellow: Due Soon / Pending / Warning
  -  Orange: Partial Payment (row highlight + badge + breakdown)
  -  Purple: Own seat highlight / Selected shifts
- **Fully responsive**: Desktop, Tablet, Mobile
- **Show/hide inactive** toggles in Fee Management and Student Management

---

## Project Structure

```
lms/
├── backend/
│   ├── controllers/
│   │   ├── adminController.js     # All admin business logic
│   │   ├── studentController.js   # Student dashboard + fees
│   │   ├── authController.js      # Login, JWT, password
│   │   ├── publicController.js    # Public seat availability
│   │   └── settingsController.js  # System settings
│   ├── models/
│   │   ├── User.js                # Student/Admin schema
│   │   ├── Seat.js                # Seat + assignments[]
│   │   ├── Shift.js               # Shift (name, startTime, endTime)
│   │   ├── Fee.js                 # Fee records (partial support)
│   │   ├── Attendance.js          # Daily attendance
│   │   ├── Floor.js / Room.js     # Library layout
│   │   ├── Notification.js        # Student notifications
│   │   ├── Request.js             # Change requests
│   │   ├── Settings.js            # System settings
│   │   ├── DoubtSession.js        # AI doubt chat history
│   │   └── MockTestAttempt.js     # AI mock test records
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── authRoutes.js
│   │   └── publicRoutes.js
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   └── errorHandler.js
│   ├── services/
│   │   └── emailService.js        # Nodemailer templates
│   ├── utils/
│   │   └── timeUtils.js           # Shift overlap detection
│   ├── scripts/
│   │   └── seedData.js
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── admin/
        │   │   ├── StudentIdCard.jsx       # Multi-shift ID card
        │   │   ├── RoomGrid.jsx
        │   │   ├── UpdateFloorPricesModal.jsx
        │   │   └── UpdateRoomPricesModal.jsx
        │   └── student/
        │       └── StudentRoomGrid.jsx
        ├── pages/
        │   ├── admin/
        │   │   ├── AdminDashboard.jsx
        │   │   ├── StudentManagement.jsx   # Multi-shift assign modal
        │   │   ├── FeeManagement.jsx
        │   │   ├── AttendanceManagement.jsx
        │   │   └── VacantSeats.jsx
        │   ├── student/
        │   │   ├── StudentDashboard.jsx
        │   │   ├── Attendance.jsx          # Rankings + top-5 green
        │   │   ├── FeeStatus.jsx
        │   │   └── AiDoubtBoard.jsx
        │   └── public/
        │       └── PublicVacantSeats.jsx
        ├── hooks/
        │   └── useShifts.js
        ├── context/
        │   └── AuthContext.jsx
        ├── utils/
        │   └── api.js
        └── App.jsx
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login (admin or student) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send OTP |
| POST | `/api/auth/reset-password` | Reset with OTP |

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/public/seats` | Seat availability (no auth) |
| GET | `/api/public/floors` | Floor/room structure |

### Admin (Protected — Admin Only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/students` | All students (with shifts[] array) |
| POST | `/api/admin/students` | Create student |
| PUT | `/api/admin/students/:id` | Update student (name, email, joinedAt, etc.) |
| DELETE | `/api/admin/students/:id` | Deactivate or delete |
| POST | `/api/admin/seats/assign` | Assign seat with shifts[] array |
| GET | `/api/admin/shifts` | All shifts |
| POST | `/api/admin/shifts` | Create shift |
| PUT | `/api/admin/shifts/:id` | Update shift |
| DELETE | `/api/admin/shifts/:id` | Delete shift |
| POST | `/api/admin/attendance` | Mark attendance |
| PUT | `/api/admin/fees/:id/paid` | Mark fee fully paid |
| PUT | `/api/admin/fees/:id/partial` | Record partial payment |
| PUT | `/api/admin/fees/bulk-update` | Bulk fee update |
| POST | `/api/admin/notifications` | Send notification |
| GET | `/api/admin/settings` | Get system settings |
| PUT | `/api/admin/settings` | Update settings (online payment toggle, etc.) |
| GET | `/api/admin/requests` | All student requests |
| PUT | `/api/admin/requests/:id` | Approve/reject request |

### Student (Protected — Student Only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/student/dashboard` | Dashboard (seat, attendance, fee, notifs) |
| GET | `/api/student/seat` | My seat + shift details |
| GET | `/api/student/attendance` | Attendance log + rankings |
| GET | `/api/student/fees` | Fee history (includes partial) |
| GET | `/api/student/notifications` | My notifications |
| POST | `/api/student/request` | Submit change request |
| PUT | `/api/student/profile` | Update profile |
| POST | `/api/student/profile/image` | Upload profile image |
| POST | `/api/student/doubt/ask` | Ask AI doubt (Groq) |
| GET | `/api/student/doubt/history` | Doubt session history |
| POST | `/api/student/mock-test/generate` | Generate AI mock test |
| GET | `/api/student/mock-test/history` | Past mock test attempts |
| POST | `/api/student/fees/:id/create-order` | Create Razorpay order |
| POST | `/api/student/fees/:id/verify-payment` | Verify Razorpay payment |

---

## Security

- JWT token-based authentication with expiry
- Passwords hashed with **bcrypt** (salt rounds: 10)
- Role-based route protection (admin vs student)
- Input validation on all endpoints
- Error handling middleware (no stack traces in production)
- QR tokens are secret (`select: false` in schema)
- Raw MongoDB `collection.updateOne` used for `createdAt` override (Mongoose timestamp bypass)

---

## Seat Assignment — Technical Detail

### Assignments Array (Seat model)

Each seat has an `assignments[]` subdocument array:

```js
assignments: [{
  student: ObjectId,        // ref User
  shift:   ObjectId,        // ref Shift (null for legacy)
  type:    'specific' | 'full_day',
  status:  'active' | 'cancelled' | 'expired',
  price:   Number,          // total price (first shift carries full amount)
  assignedAt: Date
}]
```

### Multi-shift creation

When admin assigns Shift 1 + Shift 3 to a student:
1. Two entries are pushed to `seat.assignments[]`
2. First entry: `price = totalPrice` (negotiated or summed)
3. Second entry: `price = 0` (avoids double-counting in fee)
4. One `Fee` document created with `amount = totalPrice`

### Overlap detection

For each requested shift, the backend checks all OTHER students' active assignments on that seat for time overlap using `doTimeRangesOverlap(startA, endA, startB, endB)`.

---

## Ranking System (Attendance)

- Ranked by monthly attendance percentage (higher = better rank)
- Same percentage → same rank (tie-inclusive)
- Top-5 cutoff uses `top5Cutoff` — the percentage of the student ranked 5th
- All students at or above `top5Cutoff` get the green achievement highlight
- Student's own row highlighted in blue/purple regardless of rank

---

## Troubleshooting

**MongoDB connection error:**
```bash
mongod --dbpath "C:\data\db"
```

**Port already in use:**
- Backend: change `PORT` in `.env`
- Frontend: change port in `vite.config.js`

**Email not sending:**
- Verify Google App Password (not your Gmail password)
- Check `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- Enable "Less secure app access" or use App Password

**Admission date not updating:**
- Fixed via raw MongoDB `collection.updateOne` — Mongoose `timestamps: true` blocks `createdAt` updates via `.save()`

**Fee cycle showing wrong month:**
- Fixed: fee month now derived from `student.createdAt` (join date), not `new Date()` (today)

**Razorpay button not visible:**
- Admin must enable the online payment toggle in Settings

---

## Production Deployment

```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Serve static files from backend (configure in server.js)
# 3. Set all .env variables in production environment
# 4. Use PM2 for backend process management
pm2 start server.js --name apna-lakshay

# 5. Set up Nginx reverse proxy for domain
```

**Recommended production stack:**
- VPS: DigitalOcean / Render / Railway
- Database: MongoDB Atlas
- Frontend: Vercel or served from Express static
- Domain: Cloudflare DNS

---

## Changelog

### v2.4.0 — UX & Attendance Overhaul (May 2026)
- Overhauled Student Dashboard Attendance UX with a centered overlay, pulsing FAB, and glassmorphism blur effects
- Added Admin toggle to show/hide the Login Screen Attendance check-in button globally
- Implemented PIN-based manual attendance check-in/out, bypassing QR code when enabled by admin
- Fixed IST timezone issue for midnight attendance reporting, ensuring late-night check-ins correctly register
- Consolidated Admin Dashboard settings into a unified "Settings" dropdown for global toggles (Maintenance Mode, PIN Attendance, Login Attendance, Time Restriction, Location)
- Migrated Admin Dashboard components and pages to a clean light-mode theme
- Fixed MongoDB array `$elemMatch` queries to accurately track active seat assignments in profiles and dashboards

### v2.3.0 — Multi-Shift Support (May 2026)
- Admin can assign students to multiple non-overlapping shifts simultaneously
- Seat assign modal replaced single dropdown with interactive multi-checkbox UI
- ID card dynamically shows all assigned shifts with time ranges
- Backend `assignSeat` accepts `shifts[]` array; creates one assignment per shift
- `getStudents` API now returns `shifts: [{name, startTime, endTime}]` array

### v2.2.0 — Fee Billing Cycle Fix (May 2026)
- Fixed: backdated admission (e.g., Apr 30) now correctly creates April fee cycle
- Fixed: admission date update now persists via raw MongoDB bypass of Mongoose timestamps
- Added: Show Inactive student toggle in Student Management (default hidden)

### v2.1.0 — Partial Fee System (Apr 2026)
- Admin can record partial payments with paid amount + outstanding balance
- Student dashboard shows partial fee card with orange badge
- Fee Status page shows breakdown: Paid / Outstanding / Total
- Email template for partial payment with 3-column summary
- Online payment toggle hides "Pay Online" and "Online: Attempted" when disabled

### v2.0.0 — Attendance Rankings Overhaul (Apr 2026)
- Top-5 students highlighted with green achievement row
- Tied ranks both highlighted (inclusive top-5 cutoff)
- Gold/silver/bronze colored rank labels replacing emoji badges
- Self-row highlighted in blue for easy personal identification

### v1.5.0 — AI Features (Mar 2026)
- AI Doubt Board with subject-aware prompting (Groq Llama 3.1 8B)
- AI Mock Test Generator for SSC/UPSC with negative marking
- Multi-key round-robin rotation + Groq → Gemini fallback chain

### v1.0.0 — Core System (Jan 2026)
- Seat booking, QR attendance, fee management
- Razorpay integration, email notifications
- Admin and Student role-based dashboards

---

## Developer

Developed by **Himanshu Raj**

---

## License

Proprietary — All Rights Reserved
