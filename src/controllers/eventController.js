const pool = require('../config/db');

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      start_date,
      end_date
    } = req.body;

    const newEvent = await pool.query(
      `
      INSERT INTO events
      (
        title,
        description,
        location,
        start_date,
        end_date,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        title,
        description,
        location,
        start_date,
        end_date,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await pool.query(
      `
      SELECT *
      FROM events
      ORDER BY start_date ASC
      `
    );

    res.json(events.rows);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      location,
      start_date,
      end_date
    } = req.body;

    const updatedEvent = await pool.query(
      `
      UPDATE events
      SET
        title = $1,
        description = $2,
        location = $3,
        start_date = $4,
        end_date = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        title,
        description,
        location,
        start_date,
        end_date,
        id
      ]
    );

    if (updatedEvent.rows.length === 0) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEvent = await pool.query(
      `
      DELETE FROM events
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (deletedEvent.rows.length === 0) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    res.json({
      message: 'Event deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent
};