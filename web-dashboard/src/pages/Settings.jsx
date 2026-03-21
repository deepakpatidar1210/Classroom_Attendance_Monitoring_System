import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const LAYOUT = { marginLeft: 220, fontFamily: "'Poppins',sans-serif", background: '#D6DCE4', minHeight: '100vh' };

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .cdgi-input:focus { border-color: #2C3E6B !important; outline: none; }
        .save-btn:hover { background: #1e2c50 !important; }
        .btn-cancel:hover { background: #F4F6F9 !important; }
      `}</style>
      <Sidebar />
      <div style={LAYOUT}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div style={s.pageTitle}>Settings</div>
          <div style={s.topbarDate}>{today}</div>
        </div>

        <div style={s.content}>
          <div style={s.grid}>

            {/* ===== LEFT: Profile Card ===== */}
            <div>
              {/* Avatar + Name */}
              <div style={s.profileCard}>
                <div style={s.bigAvatar}>{initials}</div>
                <div style={s.profileName}>{user?.name || '—'}</div>
                <div style={s.profileRole}>Faculty — CDGI</div>
              </div>

              {/* Profile Details */}
              <div style={s.card}>
                <div style={s.cardTitle}>👤 Profile Information</div>
                <div style={s.detailList}>
                  <div style={s.detailRow}>
                    <div style={s.detailLabel}>Full Name</div>
                    <div style={s.detailVal}>{user?.name || '—'}</div>
                  </div>
                  <div style={s.detailRow}>
                    <div style={s.detailLabel}>Email</div>
                    <div style={s.detailVal}>{user?.email || '—'}</div>
                  </div>
                  <div style={s.detailRow}>
                    <div style={s.detailLabel}>Role</div>
                    <div style={s.detailVal}>
                      <span style={s.roleBadge}>Faculty</span>
                    </div>
                  </div>
                  <div style={s.detailRow}>
                    <div style={s.detailLabel}>Employee ID</div>
                    <div style={{ ...s.detailVal, fontFamily: 'monospace' }}>
                      {profileData?.employee_id || '—'}
                    </div>
                  </div>
                  <div style={{ ...s.detailRow, borderBottom: 'none' }}>
                    <div style={s.detailLabel}>Department</div>
                    <div style={s.detailVal}>
                      {profileData?.departments?.name || 'Computer Science (CSE)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== RIGHT: Change Password ===== */}
            <div>
              <div style={s.card}>
                <div style={s.cardTitle}>🔐 Change Password</div>
                <div style={s.cardSub}>Update your login password here</div>

                {/* Current Password */}
                <div style={s.formRow}>
                  <label style={s.formLabel}>Current Password</label>
                  <div style={s.passWrap}>
                    <input className="cdgi-input" style={s.input}
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPass}
                      onChange={e => setCurrentPass(e.target.value)} />
                    <button style={s.eyeBtn} onClick={() => setShowCurrent(!showCurrent)}>
                      {showCurrent ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div style={s.formRow}>
                  <label style={s.formLabel}>New Password</label>
                  <div style={s.passWrap}>
                    <input className="cdgi-input" style={s.input}
                      type={showNew ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)} />
                    <button style={s.eyeBtn} onClick={() => setShowNew(!showNew)}>
                      {showNew ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={s.formRow}>
                  <label style={s.formLabel}>Confirm New Password</label>
                  <div style={s.passWrap}>
                    <input className="cdgi-input" style={s.input}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)} />
                    <button style={s.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Password rules */}
                {newPass.length > 0 && (
                  <div style={s.rulesBox}>
                    <div style={s.rulesTitle}>Password requirements:</div>
                    {[
                      { ok: passChecks.len,     text: 'Minimum 8 characters' },
                      { ok: passChecks.upper,   text: 'At least 1 uppercase letter' },
                      { ok: passChecks.lower,   text: 'At least 1 lowercase letter' },
                      { ok: passChecks.num,     text: 'At least 1 number' },
                      { ok: passChecks.special, text: 'At least 1 special character (!@#$%^&*)' },
                    ].map((r, i) => (
                      <div key={i} style={{ fontSize: 11, color: r.ok ? '#16A34A' : '#DC2626', marginBottom: 3 }}>
                        {r.ok ? '✓' : '✗'} {r.text}
                      </div>
                    ))}
                  </div>
                )}

                <button className="save-btn" style={{
                  ...s.saveBtn,
                  opacity: passLoading ? 0.7 : 1,
                  cursor: passLoading ? 'not-allowed' : 'pointer',
                }} onClick={handleChangePassword} disabled={passLoading}>
                  {passLoading ? 'Saving...' : '🔒 Save New Password'}
                </button>
              </div>

              {/* Account Info card */}
              <div style={s.card}>
                <div style={s.cardTitle}>ℹ️ Account Info</div>
                <div style={s.detailList}>
                  <div style={s.detailRow}>
                    <div style={s.detailLabel}>Account Type</div>
                    <div style={s.detailVal}>Teacher / Faculty</div>
                  </div>
                  <div style={{ ...s.detailRow, borderBottom: 'none' }}>
                    <div style={s.detailLabel}>System</div>
                    <div style={s.detailVal}>AMS — CDGI Attendance Monitoring</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  topbar: { background: '#fff', borderBottom: '1px solid #D0D5DF', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  pageTitle: { fontSize: 16, fontWeight: 600, color: '#1A1A1A' },
  topbarDate: { fontSize: 12, color: '#8A8A8A' },
  content: { padding: '24px 28px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, alignItems: 'start' },

  // Profile card
  profileCard: { background: '#2C3E6B', borderRadius: 6, padding: '28px 20px', textAlign: 'center', marginBottom: 16 },
  bigAvatar: { width: 72, height: 72, borderRadius: '50%', background: '#F0C040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#2C3E6B', margin: '0 auto 14px' },
  profileName: { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 },
  profileRole: { fontSize: 12, color: 'rgba(255,255,255,.5)' },

  card: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#8A8A8A', marginBottom: 16 },

  detailList: { marginTop: 14 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F4F6F9' },
  detailLabel: { fontSize: 12, color: '#8A8A8A', fontWeight: 500 },
  detailVal: { fontSize: 13, color: '#1A1A1A', fontWeight: 500, textAlign: 'right' },
  roleBadge: { background: '#EEF2FF', color: '#2C3E6B', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },

  formRow: { marginBottom: 14 },
  formLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#4A4A4A', marginBottom: 5 },
  passWrap: { position: 'relative' },
  input: { width: '100%', padding: '10px 40px 10px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', background: '#fff' },
  eyeBtn: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#AAB0BB' },

  rulesBox: { background: '#F4F6F9', borderRadius: 4, padding: '10px 12px', marginBottom: 14 },
  rulesTitle: { fontSize: 11, fontWeight: 600, color: '#4A4A4A', marginBottom: 6 },

  saveBtn: { width: '100%', background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 4, padding: '11px', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600 },
};
