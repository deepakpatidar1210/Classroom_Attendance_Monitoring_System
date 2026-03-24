const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// QR Generate — call by teacher
router.post('/generate', authMiddleware, async (req, res) => {
  const { session_id } = req.body;

  try {
    const token = uuidv4();
    const expires_at = new Date(Date.now() + 7000); // 7 seconds valid

    // delete old tokens of this session
    await supabase.from('qr_tokens').delete().eq('session_id', session_id);

    // ssve new tokens in database
    await supabase.from('qr_tokens').insert({ session_id, token, expires_at });

    // QR code image generation
    const qrImage = await QRCode.toDataURL(token);

    res.json({ token, qrImage, expires_at });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// QR Validate — for student scan
router.post('/validate', authMiddleware, async (req, res) => {
  const { token } = req.body;
  try {
    const { data, error } = await supabase
      .from('qr_tokens')
      .select('*, sessions(*, rooms(*))')
      .eq('token', token)
      .single();

    if (error || !data) return res.status(400).json({ error: 'Invalid QR code' });

    if (new Date() > new Date(data.expires_at)) {
      return res.status(400).json({ error: 'QR code expired' });
    }

    if (!data.sessions.is_active) {
      return res.status(400).json({ error: 'Session has ended' });
    }

    res.json({ valid: true, session: data.sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;