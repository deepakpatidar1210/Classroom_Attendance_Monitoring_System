const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Saare students fetch karo
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, users(name, email)');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Saare teachers fetch karo (admin ke liye)
router.get('/teachers', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*, users(name, email)');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Departments fetch karo
router.get('/departments', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teachers ki count
router.get('/teachers-count', authMiddleware, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Students ki count
router.get('/students-count', authMiddleware, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
