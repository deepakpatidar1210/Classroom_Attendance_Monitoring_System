const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// all students fetch
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

// all teachers fetch(for admin)
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

// Faculty remove — admin only
router.delete('/teacher/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { id } = req.params; // user id of teacher

  try {
    // delete from users table — 
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Departments fetch
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

// Teachers count
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

// Students count
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

// Pending approval requests fetch ( for admin )
router.get('/pending-requests', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, users(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student approve
router.patch('/approve/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const { error } = await supabase
      .from('students')
      .update({ status: 'approved' })
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student reject
router.patch('/reject/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const { error } = await supabase
      .from('students')
      .update({ status: 'rejected' })
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
