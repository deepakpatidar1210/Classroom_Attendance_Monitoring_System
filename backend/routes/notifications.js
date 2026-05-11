const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const requireAuth = require('../middleware/auth'); // assuming this exists and adds req.user

// 1. Request Password Reset (Public)
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // Check if user exists and fetch their role automatically
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single();

    if (userErr || !user) {
      return res.status(400).json({ error: 'No account found with that email.' });
    }

    // Insert notification (target_role is hardcoded to 'admin' per user request)
    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        sender_email: email,
        sender_role: user.role,
        target_role: 'admin',
        type: 'PASSWORD_RESET',
        status: 'PENDING'
      });

    if (notifErr) return res.status(400).json({ error: notifErr.message });
    res.json({ success: true, message: 'Password reset request sent to Admin.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Notifications (Protected)
router.get('/', requireAuth, async (req, res) => {
  const userRole = req.user.role; // e.g., 'admin' or 'teacher'

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('target_role', userRole)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Resolve Password Reset (Admin only)
router.post('/reset-password', requireAuth, async (req, res) => {
  const { notificationId, targetEmail, targetRole, newPassword, adminPassword } = req.body;
  const adminId = req.user.id;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action' });
  }

  try {
    // 1. Verify admin password
    const { data: adminData, error: adminErr } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', adminId)
      .single();

    if (adminErr || !adminData) return res.status(400).json({ error: 'Admin not found' });
    
    const valid = await bcrypt.compare(adminPassword, adminData.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect Admin Password' });

    // 2. Get target user ID
    const { data: targetUser, error: targetErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', targetEmail)
      .eq('role', targetRole)
      .single();

    if (targetErr || !targetUser) return res.status(400).json({ error: 'Target user not found' });

    // 3. Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', targetUser.id);

    if (updateErr) return res.status(400).json({ error: updateErr.message });

    // 4. Mark notification as RESOLVED
    const { error: resolveErr } = await supabase
      .from('notifications')
      .update({ status: 'RESOLVED' })
      .eq('id', notificationId);

    if (resolveErr) console.error('Failed to resolve notification:', resolveErr);

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
