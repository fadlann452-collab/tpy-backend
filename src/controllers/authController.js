const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    // Frontend mengirim `fullName` (camelCase); terima juga `full_name` (snake_case)
    // agar tetap kompatibel jika pemanggil lain mengirim format kolom DB langsung.
    const { full_name, fullName, email, password } = req.body;
    const name = full_name || fullName;

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: 'Email already registered'
      });
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `
      INSERT INTO users
      (full_name, email, password)
      VALUES ($1,$2,$3)
      RETURNING id, full_name, email, role
      `,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    console.log('LOGIN HIT')

    const { email, password } = req.body;

    console.log('QUERY USER START')

    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    console.log('QUERY USER DONE')

    if (user.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    console.log('COMPARE PASSWORD')

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    console.log('PASSWORD DONE')

    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }

    console.log('GENERATE TOKEN')

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    console.log('LOGIN SUCCESS')

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        full_name: user.rows[0].full_name,
        fullName: user.rows[0].full_name,
        email: user.rows[0].email,
        role: user.rows[0].role
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  register,
  login
};
