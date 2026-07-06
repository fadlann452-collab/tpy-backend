const pool = require('../config/db');

// ============================================================
// Helper: format Date -> "HH:mm" (24 jam) untuk field `time`.
// Catatan: jam yang tampil mengikuti timezone runtime Node
// (process.env.TZ). Kalau di-deploy ke server dengan TZ=UTC
// tapi ingin tampil WIB, set env TZ=Asia/Jakarta di server,
// atau sesuaikan fungsi ini menambah offset +7 jam.
// ============================================================
function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ============================================================
// Helper: pastikan user (non-admin) punya tepat 1 conversation.
// Kalau belum ada, buat otomatis (requirement #3).
// ============================================================
async function getOrCreateOwnConversation(userId) {
  const existing = await pool.query(
    'SELECT id FROM conversations WHERE user_id = $1 LIMIT 1',
    [userId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const created = await pool.query(
    'INSERT INTO conversations (user_id) VALUES ($1) RETURNING id',
    [userId]
  );

  return created.rows[0].id;
}

// ============================================================
// GET /api/chat/conversations
// - Admin      -> list semua conversation (1 per user), diurutkan
//                 dari yang paling baru ada pesan.
// - Non-admin  -> selalu tepat 1 conversation (dengan admin),
//                 dibuat otomatis kalau belum ada.
// ============================================================
const getConversations = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query(`
        SELECT
          c.id,
          u.full_name AS name,
          c.created_at,
          (
            SELECT m.text FROM messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) AS last_text,
          (
            SELECT m.created_at FROM messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) AS last_time
        FROM conversations c
        JOIN users u ON u.id = c.user_id
        ORDER BY COALESCE(
          (SELECT MAX(m2.created_at) FROM messages m2 WHERE m2.conversation_id = c.id),
          c.created_at
        ) DESC
      `);

      const conversations = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        lastMessage: row.last_text || '',
        time: formatTime(row.last_time || row.created_at),
        unread: 0,
      }));

      return res.json(conversations);
    }

    // Non-admin: pastikan conversation dengan admin sudah ada.
    const conversationId = await getOrCreateOwnConversation(req.user.id);

    const adminResult = await pool.query(
      `SELECT full_name FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`
    );
    const adminName = adminResult.rows[0]?.full_name || 'Admin TPY';

    const convResult = await pool.query(
      'SELECT created_at FROM conversations WHERE id = $1',
      [conversationId]
    );

    const lastMsgResult = await pool.query(
      `SELECT text, created_at FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [conversationId]
    );
    const lastMsg = lastMsgResult.rows[0];

    res.json([
      {
        id: conversationId,
        name: adminName,
        lastMessage: lastMsg?.text || '',
        time: formatTime(lastMsg?.created_at || convResult.rows[0].created_at),
        unread: 0,
      },
    ]);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// GET /api/chat/conversations/:id
// Detail 1 conversation (dipakai untuk judul halaman ChatDetail).
// ============================================================
const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;

    const convResult = await pool.query(
      `
      SELECT c.id, c.user_id, c.created_at, u.full_name AS owner_name
      FROM conversations c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = $1
      `,
      [id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Conversation not found',
      });
    }

    const conv = convResult.rows[0];

    // Access control: hanya pemilik conversation atau admin yang boleh lihat.
    if (req.user.role !== 'admin' && String(conv.user_id) !== String(req.user.id)) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    let displayName;
    if (req.user.role === 'admin') {
      displayName = conv.owner_name;
    } else {
      const adminResult = await pool.query(
        `SELECT full_name FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`
      );
      displayName = adminResult.rows[0]?.full_name || 'Admin TPY';
    }

    const lastMsgResult = await pool.query(
      `SELECT text, created_at FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [conv.id]
    );
    const lastMsg = lastMsgResult.rows[0];

    res.json({
      id: conv.id,
      name: displayName,
      lastMessage: lastMsg?.text || '',
      time: formatTime(lastMsg?.created_at || conv.created_at),
      unread: 0,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// GET /api/chat/conversations/:id/messages
// Riwayat pesan dalam 1 conversation, urut dari yang paling lama.
// ============================================================
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const convResult = await pool.query(
      'SELECT id, user_id FROM conversations WHERE id = $1',
      [id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Conversation not found',
      });
    }

    const conv = convResult.rows[0];

    if (req.user.role !== 'admin' && String(conv.user_id) !== String(req.user.id)) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    const messages = await pool.query(
      `
      SELECT m.id, m.text, m.created_at, u.full_name AS sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      `,
      [id]
    );

    res.json(
      messages.rows.map((row) => ({
        id: row.id,
        sender: row.sender_name,
        text: row.text,
        time: formatTime(row.created_at),
      }))
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ============================================================
// POST /api/chat/conversations/:id/messages
// Kirim pesan baru. Body: { text }
// ============================================================
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: 'Pesan tidak boleh kosong',
      });
    }

    const convResult = await pool.query(
      'SELECT id, user_id FROM conversations WHERE id = $1',
      [id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Conversation not found',
      });
    }

    const conv = convResult.rows[0];

    if (req.user.role !== 'admin' && String(conv.user_id) !== String(req.user.id)) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    const inserted = await pool.query(
      `
      INSERT INTO messages (conversation_id, sender_id, text)
      VALUES ($1, $2, $3)
      RETURNING id, text, created_at
      `,
      [id, req.user.id, text.trim()]
    );

    const row = inserted.rows[0];

    const senderResult = await pool.query(
      'SELECT full_name FROM users WHERE id = $1',
      [req.user.id]
    );
    const senderName = senderResult.rows[0]?.full_name || '';

    res.status(201).json({
      id: row.id,
      sender: senderName,
      text: row.text,
      time: formatTime(row.created_at),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
};