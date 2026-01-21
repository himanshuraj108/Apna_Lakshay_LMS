# API Documentation - Hamara Lakshya Library Management System

Base URL: `http://localhost:5000/api`

---

## Authentication

### POST `/auth/login`

Login to the system.

**Request Body:**
```json
{
  "email": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin",
    "email": "admin",
    "role": "admin"
  }
}
```

### GET `/auth/me`

Get current logged-in user details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin",
    "email": "admin",
    "role": "admin",
    "createdAt": "2026-01-22T00:00:00.000Z"
  }
}
```

---

## Public Routes

### GET `/public/seats`

Get all seats with availability (no authentication required).

**Response:**
```json
{
  "success": true,
  "floors": [
    {
      "_id": "...",
      "name": "Ground Floor",
      "level": 0,
      "rooms": [
        {
          "_id": "...",
          "name": "Room 1",
          "seats": [
            {
              "_id": "...",
              "number": "G-1",
              "isOccupied": false,
              "shift": null,
              "basePrices": {
                "day": 800,
                "night": 800,
                "full": 1200
              },
              "currentPrice": 800
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Admin Routes

**All admin routes require:**
- Header: `Authorization: Bearer <token>`
- User role: `admin`

### Dashboard

#### GET `/admin/dashboard`

Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 0,
    "totalSeats": 44,
    "occupiedSeats": 0,
    "availableSeats": 44,
    "feesCollected": 0,
    "pendingRequests": 0
  }
}
```

### Student Management

#### GET `/admin/students`

Get all students.

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "isActive": true,
      "createdAt": "2026-01-22T00:00:00.000Z"
    }
  ]
}
```

#### POST `/admin/students`

Create a new student.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student created (email sending disabled)",
  "student": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "tempPassword": "abc123xyz456"
  }
}
```

#### PUT `/admin/students/:id`

Update student details.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "isActive": true
}
```

#### DELETE `/admin/students/:id`

Delete student (marks inactive and frees seat).

**Response:**
```json
{
  "success": true,
  "message": "Student removed and seat freed"
}
```

### Floor & Seat Management

#### GET `/admin/floors`

Get all floors with rooms and seats.

**Response:**
```json
{
  "success": true,
  "floors": [
    {
      "_id": "...",
      "name": "Ground Floor",
      "level": 0,
      "rooms": [
        {
          "_id": "...",
          "name": "Room 1",
          "seats": [
            {
              "_id": "...",
              "number": "G-1",
              "isOccupied": true,
              "assignedTo": {
                "_id": "...",
                "name": "John Doe",
                "email": "john@example.com"
              },
              "shift": "full",
              "basePrices": {
                "day": 800,
                "night": 800,
                "full": 1200
              }
            }
          ]
        }
      ]
    }
  ]
}
```

#### PUT `/admin/prices`

Update base prices for all seats.

**Request Body:**
```json
{
  "dayPrice": 900,
  "nightPrice": 900,
  "fullPrice": 1400
}
```

#### POST `/admin/seats/assign`

Assign a seat to a student.

**Request Body:**
```json
{
  "seatId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "shift": "full",
  "negotiatedPrice": 1100
}
```

### Attendance Management

#### GET `/admin/attendance/:date`

Get attendance for a specific date.

**Parameters:**
- `date`: ISO date string (e.g., `2026-01-22`)

**Response:**
```json
{
  "success": true,
  "attendance": [
    {
      "_id": "...",
      "student": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "date": "2026-01-22T00:00:00.000Z",
      "status": "present",
      "markedBy": {...}
    }
  ]
}
```

#### POST `/admin/attendance`

Mark attendance for students.

**Request Body:**
```json
{
  "date": "2026-01-22",
  "attendanceData": [
    {
      "studentId": "507f1f77bcf86cd799439011",
      "status": "present"
    },
    {
      "studentId": "507f1f77bcf86cd799439012",
      "status": "absent"
    }
  ]
}
```

### Fee Management

#### GET `/admin/fees`

Get all fee records.

**Response:**
```json
{
  "success": true,
  "fees": [
    {
      "_id": "...",
      "student": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "month": 1,
      "year": 2026,
      "amount": 1200,
      "status": "paid",
      "paidDate": "2026-01-15T00:00:00.000Z",
      "dueDate": "2026-01-31T00:00:00.000Z"
    }
  ]
}
```

#### PUT `/admin/fees/:id/paid`

Mark a fee as paid.

**Response:**
```json
{
  "success": true,
  "message": "Fee marked as paid"
}
```

### Notification Management

#### POST `/admin/notifications`

Send notification/announcement.

**Request Body:**
```json
{
  "title": "Library Closing Early Tomorrow",
  "message": "The library will close at 6 PM tomorrow due to maintenance.",
  "sendToAll": true,
  "recipientId": null
}
```

OR for individual:

```json
{
  "title": "Fee Reminder",
  "message": "Please pay your pending fees.",
  "sendToAll": false,
  "recipientId": "507f1f77bcf86cd799439011"
}
```

### Request Management

#### GET `/admin/requests`

Get all student requests.

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "...",
      "student": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "type": "shift",
      "currentData": {...},
      "requestedData": {...},
      "status": "pending",
      "createdAt": "2026-01-22T00:00:00.000Z"
    }
  ]
}
```

#### PUT `/admin/requests/:id`

Approve or reject a request.

**Request Body:**
```json
{
  "status": "approved",
  "adminResponse": "Approved. Your shift has been changed."
}
```

---

## Student Routes

**All student routes require:**
- Header: `Authorization: Bearer <token>`
- User role: `student`

### Dashboard

#### GET `/student/dashboard`

Get student dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "seat": {
      "number": "G-1",
      "floor": "Ground Floor",
      "shift": "full"
    },
    "attendancePercentage": 85,
    "feeStatus": "paid",
    "unreadNotifications": 2
  }
}
```

### Seat Information

#### GET `/student/seat`

Get assigned seat details.

**Response:**
```json
{
  "success": true,
  "seat": {
    "_id": "...",
    "number": "G-1",
    "shift": "full",
    "currentPrice": 1200,
    "basePrices": {
      "day": 800,
      "night": 800,
      "full": 1200
    }
  },
  "floor": {
    "name": "Ground Floor"
  },
  "room": {
    "name": "Room 1"
  }
}
```

### Attendance

#### GET `/student/attendance`

Get attendance records with ranking.

**Response:**
```json
{
  "success": true,
  "myAttendance": [
    {
      "_id": "...",
      "date": "2026-01-22T00:00:00.000Z",
      "status": "present"
    }
  ],
  "summary": {
    "total": 20,
    "present": 17,
    "percentage": 85
  },
  "rankings": [
    {
      "rank": 1,
      "name": "John Doe",
      "studentId": "...",
      "percentage": 95,
      "isMe": true
    }
  ]
}
```

### Fees

#### GET `/student/fees`

Get fee records.

**Response:**
```json
{
  "success": true,
  "fees": [
    {
      "_id": "...",
      "month": 1,
      "year": 2026,
      "amount": 1200,
      "status": "paid",
      "dueDate": "2026-01-31T00:00:00.000Z",
      "paidDate": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

### Notifications

#### GET `/student/notifications`

Get all notifications.

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "...",
      "title": "Seat Assigned",
      "message": "Your seat G-1 has been assigned for full shift.",
      "type": "seat",
      "isRead": false,
      "createdAt": "2026-01-22T00:00:00.000Z"
    }
  ]
}
```

#### PUT `/student/notifications/:id/read`

Mark notification as read.

### Change Requests

#### POST `/student/request`

Submit a change request.

**Request Body:**
```json
{
  "type": "shift",
  "requestedData": {
    "shift": "day"
  }
}
```

### Profile Management

#### PUT `/student/profile`

Update profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

#### POST `/student/profile/image`

Upload profile image.

**Form Data:**
- `image`: File (jpg, png, gif)

#### DELETE `/student/profile/image`

Delete profile image.

---

## Error Responses

All endpoints may return error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per 15 minutes per IP
- Use `express-rate-limit` package

---

## Authentication Flow

1. User sends credentials to `/api/auth/login`
2. Server validates and returns JWT token
3. Client stores token (localStorage)
4. Client includes token in `Authorization` header for protected routes
5. Server validates token and grants access

**Token Expiry:** 7 days (configurable in `.env`)

---

**For more details, see source code in `backend/routes/` and `backend/controllers/`**
