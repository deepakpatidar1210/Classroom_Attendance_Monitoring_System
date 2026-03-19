const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const supabase = require('../config/supabase');

const FACE_SERVER_URL = process.env.FACE_SERVER_URL || 'http://localhost:5001';

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password, role, enrollment_no, semester, department_id } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ name, email, password_hash, role })
      .select()
      .single();

    if (userError) return res.status(400).json({ error: userError.message });

    if (role === 'student') {
      const { error: stuError } = await supabase
        .from('students')
        .insert({ id: user.id, enrollment_no, semester, department_id });

      if (stuError) return res.status(400).json({ error: stuError.message });
    }

    if (role === 'teacher') {
      const { employee_id } = req.body;
      const { error: teachError } = await supabase
        .from('teachers')
        .insert({ id: user.id, employee_id, department_id });

      if (teachError) return res.status(400).json({ error: teachError.message });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name, email, role } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(400).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Wrong password' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE FACE
router.post('/save-face', async (req, res) => {
  const { userId, faceImages } = req.body;
  try {
    const { error } = await supabase
      .from('students')
      .update({ face_descriptors: faceImages })
      .eq('id', userId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET FACE DESCRIPTORS
router.get('/face-descriptors/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('face_descriptors')
      .eq('id', req.params.userId)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ descriptors: data.face_descriptors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VERIFY FACE
router.post('/verify-face', async (req, res) => {
  const { userId, capturedImage } = req.body;

  try {
    const { data, error } = await supabase
      .from('students')
      .select('face_descriptors, id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(400).json({
        verified: false,
        error: 'Student not found'
      });
    }

    if (!data.face_descriptors || data.face_descriptors.length === 0) {
      return res.status(400).json({
        verified: false,
        error: 'Face not registered — please register again'
      });
    }

    // Face server URL ab .env se aata hai
    const faceRes = await axios.post(`${FACE_SERVER_URL}/verify-face`, {
      liveImage: capturedImage,
      storedDescriptors: data.face_descriptors,
    });

    res.json({
      verified: faceRes.data.verified,
      confidence: faceRes.data.confidence,
      reason: faceRes.data.reason,
    });

  } catch (err) {
    res.status(500).json({ verified: false, error: err.message });
  }
});

module.exports = router;
