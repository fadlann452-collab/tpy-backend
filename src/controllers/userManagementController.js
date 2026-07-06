const pool = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT id, full_name, email, role
      FROM users
      ORDER BY id ASC
    `);

    res.json(users.rows);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// Membuat volunteer/user baru. Kolom `password` di tabel users wajib diisi
// (dipakai untuk login), tapi form Volunteer CRUD tidak meminta admin
// mengisi password. Karena itu sistem membuatkan password sementara secara
// otomatis dan mengembalikannya SEKALI di response, supaya admin bisa
// menyampaikannya ke volunteer yang bersangkutan.
const createUser = async (req, res) => {
  try {
    const { full_name, email, role } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        message: 'Nama lengkap wajib diisi',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: 'Email wajib diisi',
      });
    }

    if (!role || !role.trim()) {
      return res.status(400).json({
        message: 'Role wajib diisi',
      });
    }

    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        message: 'Email sudah terdaftar',
      });
    }

    const temporaryPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const newUser = await pool.query(
      `
      INSERT INTO users
      (full_name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, role
      `,
      [full_name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'Volunteer created successfully',
      user: newUser.rows[0],
      temporary_password: temporaryPassword,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update nama, email, dan role volunteer/user. Tidak mengubah password.
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        message: 'Nama lengkap wajib diisi',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: 'Email wajib diisi',
      });
    }

    if (!role || !role.trim()) {
      return res.status(400).json({
        message: 'Role wajib diisi',
      });
    }

    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        message: 'Email sudah digunakan user lain',
      });
    }

    const updatedUser = await pool.query(
      `
      UPDATE users
      SET full_name = $1, email = $2, role = $3
      WHERE id = $4
      RETURNING id, full_name, email, role
      `,
      [full_name, email, role, id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.json({
      message: 'Volunteer updated successfully',
      user: updatedUser.rows[0],
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Hapus volunteer/user.
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Cegah admin yang sedang login menghapus akunnya sendiri lewat halaman ini.
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({
        message: 'Anda tidak bisa menghapus akun Anda sendiri',
      });
    }

    const deletedUser = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (deletedUser.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.json({
      message: 'Volunteer deleted successfully',
    });

  } catch (error) {
    // Kalau volunteer ini masih punya data terkait di tabel lain (mis. riwayat
    // attendance yang mereferensikan user_id-nya), Postgres akan menolak DELETE
    // dengan foreign key violation (kode 23503). Tangani ini dengan pesan yang
    // jelas alih-alih 500 generik. Tabel attendances/events sendiri TIDAK diubah.
    if (error.code === '23503') {
      return res.status(400).json({
        message:
          'Volunteer tidak bisa dihapus karena masih memiliki data terkait (misalnya riwayat attendance).',
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
