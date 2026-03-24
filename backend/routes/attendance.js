const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Attendance mark (only student)
router.post('/mark', authMiddleware, async (req, res) => {
  const { session_id, qr_verified, gps_verified, face_verified } = req.body;
  const student_id = req.user.id;

  // Role check — only student can mark attendance
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can mark attendance' });
  }

  if (!qr_verified || !gps_verified || !face_verified) {
    return res.status(400).json({ error: 'All verifications required' });
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        session_id,
        student_id,
        status: 'present',
        qr_verified,
        gps_verified,
        face_verified,
        marked_at: new Date()
      }, { onConflict: 'session_id,student_id' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, attendance: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher manual override
router.patch('/override', authMiddleware, async (req, res) => {
  const { session_id, student_id, status } = req.body;
  const teacher_id = req.user.id;

  // Role check — only teacher czn override
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only teachers can override attendance' });
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        session_id,
        student_id,
        status,
        manually_overridden: true,
        overridden_by: teacher_id
      }, { onConflict: 'session_id,student_id' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, attendance: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student attendance fetch
router.get('/student/:student_id', authMiddleware, async (req, res) => {
  const { student_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, sessions(*, subjects(name), rooms(name))')
      .eq('student_id', student_id)
      .order('marked_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session attendance fetch
router.get('/session/:session_id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(enrollment_no, users(name))')
      .eq('session_id', req.params.session_id);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Average attendance (for admin dashbaord)
router.get('/avg', authMiddleware, async (req, res) => {
  try {
    const { data: total, error: totalErr } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true });

    const { data: present, error: presentErr } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'present');

    if (totalErr || presentErr) {
      return res.status(400).json({ error: 'Could not fetch attendance data' });
    }

    const totalCount = total?.length || 0;
    const presentCount = present?.length || 0;
    const avg = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    res.json({ avg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
