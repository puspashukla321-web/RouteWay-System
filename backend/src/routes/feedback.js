const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// POST /api/feedback  { routeId?, fromStop?, toStop?, message }
router.post('/', async (req, res) => {
  const { routeId, fromStop, toStop, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Feedback message is required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO feedback (route_id, from_stop, to_stop, message) VALUES (?, ?, ?, ?)`,
      [routeId || null, fromStop || null, toStop || null, message.trim()]
    );
    res.status(201).json({ id: result.insertId, message: 'Thanks — your feedback was recorded.' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Could not save feedback.' });
  }
});

module.exports = router;
