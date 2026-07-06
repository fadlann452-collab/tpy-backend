const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userManagementController');

router.get(
  '/',
  verifyToken,
  authorizeRole('admin'),
  getAllUsers
);

router.post(
  '/',
  verifyToken,
  authorizeRole('admin'),
  createUser
);

router.put(
  '/:id',
  verifyToken,
  authorizeRole('admin'),
  updateUser
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRole('admin'),
  deleteUser
);

module.exports = router;
