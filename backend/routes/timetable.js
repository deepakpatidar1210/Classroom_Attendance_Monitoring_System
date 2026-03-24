const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Period timings fetch
router.get('/periods', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('period_timings')
      .select('*')
      .order('period_no');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// one section + day timetable fetch
router.get('/section', authMiddleware, async (req, res) => {
  const { section, day } = req.query;
  try {
    const { data, error } = await supabase
      .from('timetable')
      .select('*, subjects(id, name, code), rooms(id, name), users(id, name)')
      .eq('section', section)
      .eq('day_of_week', parseInt(day))
      .order('period_no');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teachers today schedule (teacher dashboard)
router.get('/my-schedule', authMiddleware, async (req, res) => {
  const teacher_id = req.user.id;
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const day = jsDay === 0 ? 6 : jsDay - 1; // Mon=0 ... Sat=5, Sun=6

  try {
    // Step 1: Timetable entries fetch
    const { data: entries, error } = await supabase
      .from('timetable')
      .select('*, subjects(id, name, code), rooms(id, name)')
      .eq('teacher_id', teacher_id)
      .eq('day_of_week', day)
      .order('period_no');

    if (error) return res.status(400).json({ error: error.message });

    // Step 2: Period timings fetch
    const { data: periods } = await supabase
      .from('period_timings')
      .select('*')
      .order('period_no');

    // Step 3: Merge — inject period timings in every entry
    const merged = (entries || []).map(entry => ({
      ...entry,
      period_timings: (periods || []).find(p => p.period_no === entry.period_no) || null,
    }));

    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Timetable entry save (upsert) — admin only
router.post('/save', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { section, day_of_week, period_no, subject_id, room_id, teacher_id, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from('timetable')
      .upsert({
        section, day_of_week, period_no,
        subject_id: subject_id || null,
        room_id: room_id || null,
        teacher_id: teacher_id || null,
        notes: notes || null,
      }, { onConflict: 'section,day_of_week,period_no' })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Timetable entry delete
router.delete('/delete', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { section, day_of_week, period_no } = req.body;
  try {
    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('section', section)
      .eq('day_of_week', day_of_week)
      .eq('period_no', period_no);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// whole section timetable (all days) fetch
router.get('/full', authMiddleware, async (req, res) => {
  const { section } = req.query;
  try {
    const { data, error } = await supabase
      .from('timetable')
      .select('*, subjects(id, name, code), rooms(id, name), users(id, name)')
      .eq('section', section)
      .order('day_of_week')
      .order('period_no');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
