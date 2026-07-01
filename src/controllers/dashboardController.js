const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {

    const totalUsers = await pool.query(
      'SELECT COUNT(*) FROM users'
    );

    const totalEvents = await pool.query(
      'SELECT COUNT(*) FROM events'
    );

    const totalAttendances = await pool.query(
      'SELECT COUNT(*) FROM attendances'
    );

    res.json({
      total_users: Number(totalUsers.rows[0].count),
      total_events: Number(totalEvents.rows[0].count),
      total_attendances: Number(totalAttendances.rows[0].count)
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};