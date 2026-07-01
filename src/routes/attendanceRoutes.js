const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

const {
  submitAttendance,
  getMyAttendance,
  getAllAttendance
} = require('../controllers/attendanceController');

router.post('/', verifyToken, submitAttendance);

router.get('/my', verifyToken, getMyAttendance);

router.get(
  '/',
  verifyToken,
  authorizeRole('admin'),
  getAllAttendance
);

module.exports = router;