import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function NotificationBell({ userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const dropdownRef = useRef(null);

  // Password reset modal state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.filter(n => n.status === 'PENDING'));
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetSubmit = async () => {
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    if (!adminPassword) {
      return toast.error('Please enter your admin password to verify');
    }

    setIsSubmitting(true);
    try {
      await api.post('/notifications/reset-password', {
        notificationId: selectedNotif.id,
        targetEmail: selectedNotif.sender_email,
        targetRole: selectedNotif.sender_role,
        newPassword,
        adminPassword
      });
      
      toast.success('Password updated successfully!');
      setSelectedNotif(null);
      setNewPassword('');
      setConfirmPassword('');
      setAdminPassword('');
      setIsOpen(false);
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'rgba(255,255,255,0.2)', 
          border: 'none', 
          borderRadius: '50%', 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          position: 'relative',
          color: 'white',
          fontSize: '20px',
          backdropFilter: 'blur(10px)'
        }}
      >
        🔔
        {notifications.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'var(--error)',
            color: 'white',
            fontSize: '10px',
            fontWeight: '700',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--primary)'
          }}>
            {notifications.length}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fade-in" style={{
          position: 'absolute',
          top: '50px',
          right: 0,
          width: '350px',
          background: 'var(--surface)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid var(--border)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)' }}>Notifications</div>
            <div style={{ fontSize: '12px', background: '#EEF2FF', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              {notifications.length} New
            </div>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
                You're all caught up!
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'white' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF2F2', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {n.type === 'PASSWORD_RESET' ? '🔑' : '📩'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {n.type === 'PASSWORD_RESET' ? 'Password Reset Request' : 'New Request'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{n.sender_email}</span> ({n.sender_role}) requested a password reset.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px' }}
                        onClick={() => { setSelectedNotif(n); setIsOpen(false); }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {selectedNotif && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card fade-in" style={{ width: '450px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Reset Password</div>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setSelectedNotif(null)}>✕</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Resetting password for:</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>{selectedNotif.sender_email}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase' }}>Role: {selectedNotif.sender_role}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 -24px 24px' }} />

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--error)' }}>
                  <span>🛡️</span> Admin Verification
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter YOUR admin password to authorize"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                  onClick={() => setSelectedNotif(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleResetSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Reset'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
