const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

const {
  getDashboardStats
} = require('../controllers/dashboardController');

router.get(
  '/',
  verifyToken,
  authorizeRole('admin'),
  getDashboardStats
);

module.exports = router;