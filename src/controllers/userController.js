const pool = require('../config/db');

// Mengambil data user yang sedang login (berdasarkan id dari token JWT).
// Dipanggil oleh frontend saat AuthContext bootstrap session (mis. setelah refresh halaman).
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const row = result.rows[0];

    res.json({
      id: row.id,
      full_name: row.full_name,
      fullName: row.full_name,
      email: row.email,
      role: row.role
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Update nama & email user yang sedang login.
// Menerima fullName (camelCase, dipakai frontend) maupun full_name (snake_case).
const updateMe = async (req, res) => {
  try {
    const { fullName, full_name, email } = req.body;
    const name = full_name || fullName;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Full name is required'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.user.id]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        message: 'Email already in use'
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET full_name = $1, email = $2
      WHERE id = $3
      RETURNING id, full_name, email, role
      `,
      [name, email, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const row = result.rows[0];

    res.json({
      id: row.id,
      full_name: row.full_name,
      fullName: row.full_name,
      email: row.email,
      role: row.role
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getMe,
  updateMe
};
