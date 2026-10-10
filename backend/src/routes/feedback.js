const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// POST /api/feedback  { userName, userEmail, userContact?, routeId?, fromStop?, toStop?, message }
router.post('/', async (req, res) => {
  const { userName, userEmail, userContact, routeId, fromStop, toStop, message } = req.body;

  // Validation
  if (!userName || !userName.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  
  if (!userEmail || !userEmail.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Feedback message is required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO feedback (user_name, user_email, user_contact, route_id, from_stop, to_stop, message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userName.trim(),
        userEmail.trim(),
        userContact?.trim() || null,
        routeId || null,
        fromStop || null,
        toStop || null,
        message.trim()
      ]
    );
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Thanks — your feedback was recorded. We will contact you soon if needed.' 
    });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Could not save feedback.' });
  }
});

module.exports = router;
