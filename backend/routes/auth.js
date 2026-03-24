const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const supabase = require('../config/supabase');

const FACE_SERVER_URL = process.env.FACE_SERVER_URL || 'http://localhost:5001';

// REGISTER — fro student status='pending', teacher/admin direct register
router.post('/register', async (req, res) => {
  const { name, email, password, role, enrollment_no, semester, department_id, designation } = req.body;

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
        .insert({
          id: user.id,
          enrollment_no,
          semester,
          department_id,
          status: 'pending', // pending approval
        });

      if (stuError) return res.status(400).json({ error: stuError.message });
    }

    if (role === 'teacher') {
      const { employee_id } = req.body;
      const { error: teachError } = await supabase
        .from('teachers')
        .insert({
          id: user.id,
          employee_id,
          department_id,
          designation: designation || 'Assistant Professor',
        });

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

// LOGIN — status check for student
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

    // approval status check for students
    if (user.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('status')
        .eq('id', user.id)
        .single();

      if (student?.status === 'pending') {
        return res.status(403).json({
          error: 'Your registration is pending admin approval. Please wait.',
          status: 'pending',
        });
      }
      if (student?.status === 'rejected') {
        return res.status(403).json({
          error: 'Your registration has been rejected. Please contact admin.',
          status: 'rejected',
        });
      }
    }

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

// SAVE FACE — face descriptors + one face image preview save
router.post('/save-face', async (req, res) => {
  const { userId, faceImages, facePreview } = req.body;
  try {
    const { error } = await supabase
      .from('students')
      .update({
        face_descriptors: faceImages,
        face_image: facePreview || null, // for admin preview
      })
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
      return res.status(400).json({ verified: false, error: 'Student not found' });
    }

    if (!data.face_descriptors || data.face_descriptors.length === 0) {
      return res.status(400).json({ verified: false, error: 'Face not registered' });
    }

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

// CHANGE PASSWORD
router.post('/change-password', require('../middleware/auth'), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) return res.status(400).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', userId);

    if (updateErr) return res.status(400).json({ error: updateErr.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
