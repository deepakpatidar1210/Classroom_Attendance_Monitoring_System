const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Session banao (teacher)
router.post('/create', authMiddleware, async (req, res) => {
  const { subject_id, room_id, date, start_time, end_time } = req.body;
  const teacher_id = req.user.id;
  try {
    // start_time timestamptz hai — date + time combine karke proper timestamp banao
    const start_timestamp = new Date(`${date}T${start_time}:00`).toISOString();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        teacher_id,
        subject_id,
        room_id,
        date,
        start_time: start_timestamp,
        end_time, // text hai — as-is bhejo
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher ke saari sessions
router.get('/teacher/:teacher_id', authMiddleware, async (req, res) => {
  const { teacher_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, subjects(name, code), rooms(name)')
      .eq('teacher_id', teacher_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/end/:session_id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', req.params.session_id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, session: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
