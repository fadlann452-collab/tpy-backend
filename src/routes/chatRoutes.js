const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');

const {
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');

// Tidak pakai authorizeRole('admin') di sini karena endpoint ini memang
// harus bisa diakses oleh user biasa MAUPUN admin (requirement #1).
// Pembatasan akses per-conversation (siapa boleh lihat conversation siapa)
// ditangani di dalam chatController, bukan di layer route.
router.get('/conversations', verifyToken, getConversations);
router.get('/conversations/:id', verifyToken, getConversationById);
router.get('/conversations/:id/messages', verifyToken, getMessages);
router.post('/conversations/:id/messages', verifyToken, sendMessage);

module.exports = router;