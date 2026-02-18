# Deployment Guide - Apna Lakshay

## Prerequisites

- **Server**: VPS or cloud instance (AWS, DigitalOcean, etc.)
- **Node.js**: v16 or higher
- **MongoDB**: Running instance (local or Atlas)
- **Domain**: Optional, for production URL
- **SSL**: Optional, for HTTPS (Let's Encrypt)

---

## Production Build

### Backend Deployment

1. **Prepare Environment Variables**

Create `.env` file with production settings:

```env
# Server
PORT=5000
NODE_ENV=production

# Database - Use MongoDB Atlas or hosted instance
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hamara-lakshay

# JWT
JWT_SECRET=your_super_secure_random_secret_key_here_minimum_32_characters
JWT_EXPIRE=7d

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Hamara Lakshya <your-email@gmail.com>"

# Frontend URL (production domain)
FRONTEND_URL=https://yourdomain.com
APK_DOWNLOAD_URL=https://yourdomain.com/app.apk
```

2. **Install Dependencies**

```bash
cd backend
npm install --production
```

3. **Seed Database** (first time only)

```bash
node scripts/seedData.js
```

4. **Start Backend with PM2**

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
pm2 start server.js --name hamara-lakshay-backend

# Save PM2 process
pm2 save

# Enable PM2 on startup
pm2 startup
```

---

### Frontend Deployment

1. **Update API URL**

In `frontend/src/utils/api.js`, ensure the base URL points to production:

```javascript
const api = axios.create({
  baseURL: 'https://api.yourdomain.com/api', // OR use relative '/api' if same domain
  headers: {
    'Content-Type': 'application/json',
  },
});
```

2. **Build Frontend**

```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/dist/`.

3. **Serve Static Files**

**Option A: Serve from Backend (Same Domain)**

Update `backend/server.js` to serve frontend:

```javascript
// After all API routes
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
```

**Option B: Separate Frontend Hosting (Vercel/Netlify)**

Deploy `frontend/dist/` to:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop `dist` folder
- **Nginx**: Configure server block (see below)

---

## Nginx Configuration (Recommended)

### Backend Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend Hosting

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/hamara-lakshay/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## MongoDB Atlas Setup (Recommended)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free M0 tier available)
3. Create database user
4. Whitelist IP addresses (or `0.0.0.0/0` for any IP)
5. Get connection string and update `MONGODB_URI` in `.env`

---

## Environment-Specific Settings

### Development

```env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Production

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

---

## Security Checklist

- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS with SSL certificate
- [ ] Whitelist MongoDB IP addresses
- [ ] Set secure CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting (optional: `express-rate-limit`)
- [ ] Add helmet.js for security headers
- [ ] Regular security updates (`npm audit fix`)

---

## Performance Optimization

### Backend

```javascript
// Compression
const compression = require('compression');
app.use(compression());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### Frontend

- Already optimized with Vite production build
- Lazy loading with React.lazy() (optional)
- Image optimization
- CDN for static assets (optional)

---

## Monitoring & Logs

### PM2 Monitoring

```bash
# View logs
pm2 logs hamara-lakshay-backend

# Monitor processes
pm2 monit

# View status
pm2 status
```

### Application Logs

Backend logs errors to console - redirect to file in production:

```bash
pm2 start server.js --name hamara-lakshay-backend --log /var/log/hamara-lakshay/backend.log
```

---

## Backup Strategy

### MongoDB Backups

**Automated with MongoDB Atlas**: Enable point-in-time recovery

**Manual Backup**:

```bash
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)
```

**Restore**:

```bash
mongorestore --uri="mongodb+srv://..." /backups/20260122
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs hamara-lakshay-backend

# Check MongoDB connection
mongo "mongodb+srv://..."

# Verify environment variables
cat .env
```

### Frontend 404 Errors

- Ensure Nginx `try_files` directive is set
- Check if `index.html` exists in dist folder
- Verify API proxy configuration

### CORS Errors

Update backend CORS settings:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

---

## Scaling Considerations

### Horizontal Scaling

- Use MongoDB replica sets
- Load balance with Nginx
- Session management with Redis (if needed)

### Vertical Scaling

- Increase server resources (RAM, CPU)
- Optimize database indexes
- Enable MongoDB caching

---

## Production Checklist

- [x] Environment variables configured
- [x] MongoDB hosted (Atlas or VPS)
- [x] Backend running with PM2
- [x] Frontend built and deployed
- [x] Nginx configured
- [x] SSL certificate enabled
- [x] DNS records updated
- [x] Database seeded with admin user
- [x] Email service tested
- [x] Backup strategy in place
- [x] Monitoring enabled

---

** Your Apna Lakshay application is now live in production!**

For support: Contact your development team
