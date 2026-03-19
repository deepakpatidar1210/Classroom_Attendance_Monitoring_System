import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [qrImage, setQrImage] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    room_id: '',
    subject_id: '',
    start_time: '10:00',
    end_time: '10:50',
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    generateQR(activeSession);
    const interval = setInterval(() => {
      generateQR(activeSession);
      setCountdown(5);
    }, 5000);
    const tick = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 5), 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, [activeSession]);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/sessions/teacher/${user.id}`);
      setSessions(res.data);
    } catch (err) {
      toast.error('Could not fetch sessions');
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/sessions/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error('Could not fetch subjects');
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/sessions/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Could not fetch rooms');
    }
  };

  const generateQR = async (session_id) => {
    try {
      const res = await api.post('/qr/generate', { session_id });
      setQrImage(res.data.qrImage);
    } catch (err) {
      console.error(err);
    }
  };

  const createSession = async () => {
    if (!form.subject_id || !form.room_id) {
      toast.error('Please select subject and room');
      return;
    }
    try {
      const res = await api.post('/sessions/create', {
        subject_id: form.subject_id,
        room_id: form.room_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
      });
      setSessions(prev => [res.data, ...prev]);
      setActiveSession(res.data.id);
      setShowForm(false);
      toast.success('Session started!');
    } catch (err) {
      toast.error('Could not create session');
    }
  };

  const endSession = async (session_id) => {
    try {
      await api.patch(`/sessions/end/${session_id}`);
      setActiveSession(null);
      setQrImage(null);
      setSessions(prev =>
        prev.map(s => s.id === session_id ? { ...s, is_active: false } : s)
      );
      toast.success('Session ended!');
    } catch (err) {
      toast.error('Could not end session');
    }
  };

  const timeSlots = [];
  for (let h = 8; h <= 18; h++) {
    ['00', '10', '20', '30', '40', '50'].forEach(m => {
      timeSlots.push(`${String(h).padStart(2, '0')}:${m}`);
    });
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.sub}>Welcome, {user?.name}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={styles.btn}>
            {showForm ? 'Cancel' : '+ New Session'}
          </button>
        </div>

        {showForm && (
          <div style={styles.formCard}>
            <div style={styles.cardTitle}>Create New Session</div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  style={styles.select}
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room</label>
                <select
                  style={styles.select}
                  value={form.room_id}
                  onChange={e => setForm({ ...form, room_id: e.target.value })}
                >
                  <option value="">Select room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select
                  style={styles.select}
                  value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })}
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start time</label>
                <select
                  style={styles.select}
                  value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                >
                  {timeSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>End time</label>
                <select
                  style={styles.select}
                  value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })}
                >
                  {timeSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>&nbsp;</label>
                <button onClick={createSession} style={styles.btn}>
                  Generate QR
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.statRow}>
          <StatCard label="Total sessions" value={sessions.length} />
          <StatCard
            label="Today's sessions"
            value={sessions.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
          />
          <StatCard
            label="Active session"
            value={activeSession ? 'Live' : 'None'}
            color={activeSession ? '#1D9E75' : '#888'}
          />
        </div>

        {activeSession && qrImage && (
          <div style={styles.qrCard}>
            <div style={styles.qrHeader}>
              <span style={styles.qrTitle}>Live QR Code</span>
              <span style={styles.qrTimer}>
                Refreshes in <b style={{ color: '#E24B4A' }}>{countdown}s</b>
              </span>
            </div>
            <img src={qrImage} alt="QR Code" style={styles.qrImg} />
            <p style={styles.qrSub}>
              Show this on projector — students will scan to mark attendance
            </p>
            <button
              onClick={() => endSession(activeSession)}
              style={styles.endBtn}
            >
              End Session
            </button>
          </div>
        )}

        <div style={styles.card}>
          <span style={styles.cardTitle}>Recent Sessions</span>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Room</th>
                <th style={styles.th}>Timing</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.date}</td>
                  <td style={styles.td}>{s.subjects?.name || '—'}</td>
                  <td style={styles.td}>{s.rooms?.name || '—'}</td>
                  <td style={styles.td}>
                    {s.start_time && s.end_time
                      ? `${s.start_time} - ${s.end_time}`
                      : '—'}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 500,
                      background: s.is_active ? '#E1F5EE' : '#F1EFE8',
                      color: s.is_active ? '#0F6E56' : '#5F5E5A',
                    }}>
                      {s.is_active ? 'Active' : 'Ended'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {s.is_active ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setActiveSession(s.id)}
                          style={styles.smallBtn}
                        >
                          Show QR
                        </button>
                        <button
                          onClick={() => endSession(s.id)}
                          style={{
                            ...styles.smallBtn,
                            color: '#A32D2D',
                            borderColor: '#E24B4A',
                          }}
                        >
                          End
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#888' }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  main: { flex: 1, padding: 24, background: '#f7f6f3', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 500, color: '#111' },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  btn: { padding: '9px 18px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  formCard: { background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: 12, padding: 20, marginBottom: 20 },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: '#888' },
  select: { padding: '8px 12px', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, color: '#111', background: '#fff' },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  qrCard: { background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: 12, padding: 20, marginBottom: 20, textAlign: 'center' },
  qrHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 },
  qrTitle: { fontSize: 14, fontWeight: 500, color: '#111' },
  qrTimer: { fontSize: 13, color: '#888' },
  qrImg: { width: 220, height: 220, borderRadius: 8 },
  qrSub: { fontSize: 12, color: '#888', marginTop: 10, marginBottom: 12 },
  endBtn: { padding: '8px 24px', background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #E24B4A', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  card: { background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: 500, color: '#111', display: 'block', marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 500, paddingBottom: 8, borderBottom: '0.5px solid #e8e6e0' },
  td: { padding: '10px 0', fontSize: 13, color: '#111', borderBottom: '0.5px solid #f0ede8' },
  smallBtn: { padding: '5px 12px', background: '#f7f6f3', border: '0.5px solid #ddd', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
};