import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);

  // Change password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const passChecks = {
    len:     newPass.length >= 8,
    upper:   /[A-Z]/.test(newPass),
    lower:   /[a-z]/.test(newPass),
    num:     /[0-9]/.test(newPass),
    special: /[!@#$%^&*]/.test(newPass),
  };

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/students/teachers');
      const me = res.data.find(t => t.id === user.id);
      setProfileData(me);
    } catch { console.error('profile fetch failed'); }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass)
      return toast.error('Please fill all fields');
    if (newPass.length < 8)
      return toast.error('Password must be at least 8 characters');
    if (newPass !== confirmPass)
      return toast.error('New password and confirm password do not match');
    if (currentPass === newPass)
      return toast.error('New password must be different from current password');

    setPassLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      toast.success('Password changed successfully!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not change password');
    } finally { setPassLoading(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FA';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Sidebar />
      <div className="page-container" style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>Settings</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{today}</div>
          </div>
        </header>

        <div style={{ padding: '32px', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px', alignItems: 'start' }}>

            {/* ===== LEFT: Profile Card ===== */}
            <div>
              {/* Avatar + Name */}
              <div className="card" style={{ background: 'var(--primary)', padding: '32px 24px', textAlign: 'center', marginBottom: '24px', border: 'none' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: 'var(--primary)', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{initials}</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>{user?.name || '—'}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Faculty — CDGI</div>
              </div>

              {/* Profile Details */}
              <div className="card">
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>👤 Profile Information</div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Full Name</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500', textAlign: 'right' }}>{user?.name || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Email</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500', textAlign: 'right' }}>{user?.email || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Role</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500', textAlign: 'right' }}>
                      <span style={{ background: '#EEF2FF', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>Faculty</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Employee ID</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500', textAlign: 'right', fontFamily: 'monospace' }}>
                      {profileData?.employee_id || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Department</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500', textAlign: 'right' }}>
                      {profileData?.departments?.name || 'Computer Science (CSE)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== RIGHT: Change Password ===== */}
            <div>
              <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>🔐 Change Password</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Update your login password here</div>

                {/* Current Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPass}
                      onChange={e => setCurrentPass(e.target.value)} />
                    <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }} onClick={() => setShowCurrent(!showCurrent)}>
                      {showCurrent ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)} />
                    <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }} onClick={() => setShowNew(!showNew)}>
                      {showNew ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)} />
                    <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }} onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Password rules */}
                {newPass.length > 0 && (
                  <div style={{ background: 'var(--bg-color)', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>Password requirements:</div>
                    {[
                      { ok: passChecks.len,     text: 'Minimum 8 characters' },
                      { ok: passChecks.upper,   text: 'At least 1 uppercase letter' },
                      { ok: passChecks.lower,   text: 'At least 1 lowercase letter' },
                      { ok: passChecks.num,     text: 'At least 1 number' },
                      { ok: passChecks.special, text: 'At least 1 special character (!@#$%^&*)' },
                    ].map((r, i) => (
                      <div key={i} style={{ fontSize: '12px', color: r.ok ? 'var(--success)' : 'var(--error)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{r.ok ? '✓' : '✗'}</span> <span>{r.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: passLoading ? 0.7 : 1, cursor: passLoading ? 'not-allowed' : 'pointer' }} onClick={handleChangePassword} disabled={passLoading}>
                  {passLoading ? 'Saving...' : '🔒 Save New Password'}
                </button>
              </div>

              {/* Account Info card */}
              <div className="card">
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '12px' }}>ℹ️ Account Info</div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Account Type</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500', textAlign: 'right' }}>Teacher / Faculty</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>System</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500', textAlign: 'right' }}>AttendSoft — CDGI Attendance Monitoring</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
