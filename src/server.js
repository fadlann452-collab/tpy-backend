const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middleware/authMiddleware');
const authorizeRole = require('./middleware/roleMiddleware');
const eventRoutes = require('./routes/eventRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/profile', verifyToken, (req, res) => {
  res.json({
    message: 'Protected Route Accessed',
    user: req.user
  });
});

app.get(
  '/api/admin',
  verifyToken,
  authorizeRole('admin'),
  (req, res) => {
    res.json({
      message: 'Welcome Admin'
    });
  }
);

app.get('/', (req, res) => {
  res.json({
    message: 'TPY Management API Running'
  });
});

pool.connect()
  .then(() => {
    console.log('✅ Database Connected');
  })
  .catch((err) => {
    console.error('❌ Database Connection Error:', err.message);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
