const pool = require('../config/db');

const submitAttendance = async (req, res) => {
  try {
    const {
      event_id,
      photo_url
    } = req.body;

    const existingAttendance = await pool.query(
  `
  SELECT *
  FROM attendances
  WHERE user_id = $1
  AND event_id = $2
  `,
  [
    req.user.id,
    event_id
  ]
);

if (existingAttendance.rows.length > 0) {
  return res.status(400).json({
    message: 'Attendance already submitted'
  });
}
    const attendance = await pool.query(
      `
      INSERT INTO attendances
      (
        user_id,
        event_id,
        photo_url
      )
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [
        req.user.id,
        event_id,
        photo_url
      ]
    );

    res.status(201).json({
      message: 'Attendance submitted successfully',
      attendance: attendance.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT a.*, e.title AS event_title
      FROM attendances a
      JOIN events e ON a.event_id = e.id
      WHERE a.user_id = $1
      ORDER BY a.check_in_time DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT a.*, u.full_name, e.title AS event_title
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      JOIN events e ON a.event_id = e.id
      ORDER BY a.check_in_time DESC
      `
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  submitAttendance,
  getMyAttendance,
  getAllAttendance
};