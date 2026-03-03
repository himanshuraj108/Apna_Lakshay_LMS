# Apna Lakshay - Library Management System

A production-ready MERN stack web application for offline library seat booking and digital management.

## Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT 
- **Email**: Nodemailer with Google App Password and SMTP

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)
- Google App Password for email notifications

### Installation

1. **Clone and Install Backend**
```bash
cd backend
npm install
```

2. **Install Frontend**
```bash
cd ../frontend
npm install
```

3. **Configure Environment Variables**

Backend `.env` file is already configured with:
- MongoDB URI: `mongodb://localhost:27017/hamara-lakshay`
- Email: `himanshuraj48512@gmail.com`
- JWT Secret: Pre-configured

### Seed Database

```bash
cd backend
node scripts/seedData.js
```

This creates:
- Admin user (email: `admin`, password: `admin123`)
- Ground Floor: 1 Room, 20 Seats
- First Floor: 2 Rooms (7 + 12 seats)
- Second Floor: 1 Room, 5 Seats
- Total: 44 Seats

### Run Application

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

## Default Credentials

**Admin Login:**
- Email: `admin`
- Password: `admin123`

**Student Accounts:**
Students are created by admin and receive credentials via email.

## Features

### Admin Features
- Dashboard with analytics (students, seats, fees, requests)
- Student CRUD operations with email notifications
- Floor/Room/Seat management with dynamic pricing
- Seat assignment to students
- Daily attendance marking
- Fee management (mark as paid, send confirmations)
- Send announcements (global or individual)
- Approve/reject student requests

### Student Features
- Dashboard with seat, attendance, fee, notification cards
- View own seat on visual map (highlighted)
- Attendance tracking with ranking system
- Study planner / to-do list
- Fee status and history
- Notification center
- Profile management with image upload
- Submit change requests (seat/shift/profile)

### Public Features
- View seat availability without login
- Floor selector with room/seat grid
- Available seats show prices, occupied seats don't
- Mobile modal: "Download App" / "Continue in Browser"

## Email System

Sends automated emails for:
- Student credential delivery
- Seat assignment confirmation
- Request approval/rejection
- Fee payment confirmation
- Fee due reminders (5 days before month end)
- Admin announcements

All emails are branded with premium HTML templates.

## UI/UX Highlights

- **Premium Gradient Backgrounds**: Modern purple-to-pink gradients
- **Glassmorphism**: Frosted glass effect cards
- **Framer Motion Animations**: Smooth entrance and hover effects
- **Skeleton Loaders**: Professional loading states (no spinners)
- **Color-Coded Statuses**:
  - 🟢 Green: Available / Paid / Present
  - 🔴 Red: Occupied / Overdue / Absent
  - 🟡 Yellow: Due Soon / Pending
- **Fully Responsive**: Desktop, Tablet, Mobile

## 📁 Project Structure

```
lms/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & error handlers
│   ├── services/        # Email service
│   ├── scripts/         # Seed data
│   └── server.js        # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Route pages
    │   ├── context/     # Auth context
    │   ├── utils/       # API helper
    │   └── App.jsx      # Main app with routing
    └── index.html       # Entry HTML
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes (role-based access)
- Input validation
- Error handling middleware

## 🧪 Testing

1. **Public Access**: Open `http://localhost:5173` - should show seat availability
2. **Admin Login**: Login with `admin` / `admin123`
3. **Create Student**: Add a student (email will be sent)
4. **Assign Seat**: Assign a seat to the student
5. **Student Login**: Login with the student's credentials from email

## 📝 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Public
- `GET /api/public/seats` - Get seat availability

### Admin (Protected, Admin Only)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Create student
- `POST /api/admin/seats/assign` - Assign seat
- `POST /api/admin/attendance` - Mark attendance
- `PUT /api/admin/fees/:id/paid` - Mark fee as paid
- `POST /api/admin/notifications` - Send notification

### Student (Protected)
- `GET /api/student/dashboard` - Dashboard data
- `GET /api/student/seat` - My seat details
- `GET /api/student/attendance` - Attendance with ranking
- `GET /api/student/fees` - Fee status
- `GET /api/student/notifications` - Notifications
- `POST /api/student/request` - Submit change request
- `POST /api/student/profile/image` - Upload profile image

## 🎯 Key Implementation Details

### Offline-First Model
- Students visit library in person
- Admin assigns seats after offline visit
- Attendance marked on paper, updated by admin
- Monthly fees paid in cash

### Pricing Logic
- Base prices: Day ₹800, Night ₹800, Full ₹1200
- Admin can update base prices anytime
- Negotiated price per student (if different from base)
- Students see only their own price
- Public users see prices only for available seats

### Ranking System
- Based on monthly attendance percentage
- Same percentage = same rank
- Student's own name highlighted in ranking table

## 🛠️ Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod --dbpath "C:\data\db"`
- Check connection URI in `.env`

**Port Already in Use:**
- Backend: Change PORT in `.env`
- Frontend: Change port in `vite.config.js`

**Email Not Sending:**
- Verify Google App Password is correct
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`

## Production Deployment

1. Build frontend: `cd frontend && npm run build`
2. Serve static files from backend
3. Set environment variables in production
4. Use PM2 or similar for backend process management
5. Set up reverse proxy (Nginx) for domain

## Developer 

Built with ❤️ for Apna Lakshay Library

## 📄 License

Proprietary - All Rights Reserved
