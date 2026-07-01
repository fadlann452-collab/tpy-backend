const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

const {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

router.get('/', verifyToken, getAllEvents);

router.post(
  '/',
  verifyToken,
  authorizeRole('admin'),
  createEvent
);
router.put(
  '/:id',
  verifyToken,
  authorizeRole('admin'),
  updateEvent
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRole('admin'),
  deleteEvent
);

module.exports = router;