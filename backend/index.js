const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const attendanceRoutes = require('./routes/attendance');
const qrRoutes = require('./routes/qr');
const studentRoutes = require('./routes/students');
const timetableRoutes = require('./routes/timetable');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Hardcoded + env-variable based CORS — works even if DASHBOARD_URL env var is misconfigured
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://classroom-attendance-monitoring-sys-gold.vercel.app', // production
  process.env.DASHBOARD_URL, // Railway env variable (extra safety)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow Postman, curl, mobile apps (requests with no Origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.json({ message: 'AttendSoft API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
