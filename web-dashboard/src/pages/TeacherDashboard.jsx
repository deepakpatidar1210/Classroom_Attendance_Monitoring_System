import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const LAYOUT = { marginLeft: 220, fontFamily: "'Poppins',sans-serif", background: '#D6DCE4', minHeight: '100vh' };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [showModal, setShowModal] = useState(false);

  // Timetable based state
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null); // selected period from schedule
  const [manualMode, setManualMode] = useState(false);

  // Manual form (fallback)
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    subject_id: '', room_id: '', start_time: '09:00', end_time: '09:50', section: '',
  });

  const intervalRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    fetchTodaySchedule();
    fetchSubjects();
    fetchRooms();
    return () => { clearInterval(intervalRef.current); clearInterval(tickRef.current); };
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    generateQR(activeSession);
    intervalRef.current = setInterval(() => { generateQR(activeSession); setCountdown(5); }, 5000);
    tickRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 5), 1000);
    return () => { clearInterval(intervalRef.current); clearInterval(tickRef.current); };
  }, [activeSession]);

  const fetchSessions = async () => {
    try { const res = await api.get(`/sessions/teacher/${user.id}`); setSessions(res.data); }
    catch { toast.error('Could not fetch sessions'); }
  };

  const fetchTodaySchedule = async () => {
    setScheduleLoading(true);
    try {
      const res = await api.get('/timetable/my-schedule');
      setTodaySchedule(res.data);
    } catch { console.error('schedule fetch failed'); }
    finally { setScheduleLoading(false); }
  };

  const fetchSubjects = async () => {
    try { const res = await api.get('/sessions/subjects'); setSubjects(res.data); }
    catch { console.error('subjects fetch failed'); }
  };
  const fetchRooms = async () => {
    try { const res = await api.get('/sessions/rooms'); setRooms(res.data); }
    catch { console.error('rooms fetch failed'); }
  };

  const generateQR = async (session_id) => {
    try { const res = await api.post('/qr/generate', { session_id }); setQrImage(res.data.qrImage); }
    catch { console.error('QR generate failed'); }
  };

  // Timetable slot se session create karo — ek click
  const createFromSlot = async (slot) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await api.post('/sessions/create', {
        date: today,
        subject_id: slot.subjects?.id,
        room_id: slot.rooms?.id,
        start_time: slot.period_timings?.start_time || slot.start_time,
        end_time: slot.period_timings?.end_time || slot.end_time,
        section: slot.section,
      });
      setSessions(prev => [res.data, ...prev]);
      setActiveSession(res.data.id);
      setShowModal(false);
      toast.success(`Session started! — ${slot.subjects?.name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create session');
    }
  };

  // Manual form se session create karo
  const createManual = async () => {
    if (!form.subject_id || !form.room_id) { toast.error('Please select subject and room'); return; }
    try {
      const res = await api.post('/sessions/create', form);
      setSessions(prev => [res.data, ...prev]);
      setActiveSession(res.data.id);
      setShowModal(false);
      toast.success('Session started! QR is live.');
    } catch { toast.error('Could not create session'); }
  };

  const endSession = async (session_id) => {
    if (!confirm('End this session?')) return;
    try {
      await api.patch(`/sessions/end/${session_id}`);
      clearInterval(intervalRef.current); clearInterval(tickRef.current);
      setActiveSession(null); setQrImage(null);
      setSessions(prev => prev.map(s => s.id === session_id ? { ...s, is_active: false } : s));
      toast.success('Session ended successfully.');
    } catch { toast.error('Could not end session'); }
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todaySessions = sessions.filter(s => s.date === new Date().toISOString().split('T')[0]);
  const activeObj = sessions.find(s => s.id === activeSession);

  // Current time check — is period ka time aa gaya hai?
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const isCurrentPeriod = (slot) => {
    if (!slot.period_timings) return false;
    const [sh, sm] = slot.period_timings.start_time.split(':').map(Number);
    const [eh, em] = slot.period_timings.end_time.split(':').map(Number);
    return currentMins >= sh * 60 + sm && currentMins <= eh * 60 + em;
  };

  // Already session start hai is slot ke liye aaj?
  const alreadyStarted = (slot) => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.some(s =>
      s.date === today &&
      s.subjects?.id === slot.subjects?.id &&
      (s.is_active || s.start_time?.includes(slot.period_timings?.start_time?.slice(0, 5)))
    );
  };

  const timeSlots = [];
  for (let h = 8; h <= 18; h++) {
    ['00', '10', '20', '30', '40', '50'].forEach(m => timeSlots.push(`${String(h).padStart(2, '0')}:${m}`));
  }

  const jsDay = new Date().getDay();
  const todayName = DAYS[jsDay === 0 ? 6 : jsDay - 1];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .cdgi-tr:hover { background: #F4F6F9; }
        .cdgi-btn-new:hover { background: #1e2c50 !important; }
        .cdgi-btn-end:hover { background: #FEF2F2 !important; }
        .cdgi-cancel:hover { background: #F4F6F9 !important; }
        .cdgi-primary:hover { background: #1e2c50 !important; }
        .slot-card:hover { border-color: #2C3E6B !important; background: #F4F6F9 !important; }
        .start-slot-btn:hover { background: #1e2c50 !important; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes barFill { from{width:100%} to{width:0%} }
      `}</style>
      <Sidebar />
      <div style={LAYOUT}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div style={s.pageTitle}>Dashboard</div>
          <div style={s.topbarDate}>{today}</div>
        </div>

        <div style={s.content}>
          {/* Stats */}
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statLabel}>Today's Sessions</div>
              <div style={s.statVal}>{todaySessions.length}</div>
              <div style={s.statSub}>{todaySessions.filter(s => !s.is_active).length} completed</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>Total Sessions</div>
              <div style={s.statVal}>{sessions.length}</div>
              <div style={s.statSub}>All time</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>Active Session</div>
              <div style={{ ...s.statVal, color: activeSession ? '#16A34A' : '#8A8A8A' }}>
                {activeSession ? 'LIVE' : 'None'}
              </div>
              <div style={s.statSub}>{activeSession ? 'QR is running' : 'Start a new session'}</div>
            </div>
          </div>

          {/* TODAY'S SCHEDULE — main section */}
          <div style={s.card}>
            <div style={s.sectionHeader}>
              <div style={s.sectionTitle}>📅 Today's Schedule — {todayName}</div>
              <button className="cdgi-btn-new" style={{ ...s.newSessionBtn, marginBottom: 0 }}
                onClick={() => { setManualMode(true); setShowModal(true); }}>
                + Manual Session
              </button>
            </div>

            {scheduleLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8A8A8A', fontSize: 13 }}>
                Loading your schedule...
              </div>
            ) : todaySchedule.length === 0 ? (
              <div style={s.emptySchedule}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                <div style={{ fontSize: 13, color: '#4A4A4A', fontWeight: 500 }}>No classes scheduled today</div>
                <div style={{ fontSize: 12, color: '#8A8A8A', marginTop: 4 }}>
                  Use "Manual Session" to start a session manually
                </div>
              </div>
            ) : (
              <div style={s.scheduleGrid}>
                {todaySchedule.map((slot, i) => {
                  const isCurrent = isCurrentPeriod(slot);
                  const started = alreadyStarted(slot);
                  const pt = slot.period_timings;
                  return (
                    <div key={i} className="slot-card" style={{
                      ...s.slotCard,
                      borderColor: isCurrent ? '#2C3E6B' : '#D0D5DF',
                      background: isCurrent ? '#EEF2FF' : '#fff',
                    }}>
                      {isCurrent && (
                        <div style={s.currentBadge}>
                          <div style={s.liveDot} /> NOW
                        </div>
                      )}
                      <div style={s.slotPeriod}>{pt?.label || `Period ${slot.period_no}`}</div>
                      <div style={s.slotTime}>
                        {pt ? `${pt.start_time.slice(0, 5)} – ${pt.end_time.slice(0, 5)}` : '—'}
                      </div>
                      <div style={s.slotSubject}>
                        {slot.subjects?.name || slot.notes || 'Free'}
                      </div>
                      {slot.subjects?.code && (
                        <div style={s.slotCode}>{slot.subjects.code}</div>
                      )}
                      <div style={s.slotRoom}>🏫 {slot.rooms?.name || '—'}</div>
                      <div style={s.slotSection}>👥 {slot.section}</div>

                      {slot.subjects && !started && (
                        <button className="start-slot-btn" style={s.startSlotBtn}
                          onClick={() => createFromSlot(slot)}>
                          ▶ Start Session
                        </button>
                      )}
                      {started && (
                        <div style={s.startedBadge}>✓ Session Started</div>
                      )}
                      {!slot.subjects && (
                        <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 8, textAlign: 'center' }}>
                          {slot.notes || 'No class'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active session QR card */}
          {activeSession && qrImage && (
            <div style={s.activeCard}>
              <div style={s.asHeader}>
                <div style={s.asTitle}>
                  {activeObj?.subjects?.name || 'Session'} — Active
                </div>
                <div style={s.livePill}>
                  <div style={s.liveDot} />
                  LIVE
                </div>
              </div>
              <div style={s.sessionInfoGrid}>
                <div style={s.siItem}><div style={s.siLabel}>Subject</div><div style={s.siVal}>{activeObj?.subjects?.name || '—'}</div></div>
                <div style={s.siItem}><div style={s.siLabel}>Room</div><div style={s.siVal}>{activeObj?.rooms?.name || '—'}</div></div>
                <div style={s.siItem}><div style={s.siLabel}>Date</div><div style={s.siVal}>{activeObj?.date}</div></div>
                <div style={s.siItem}><div style={s.siLabel}>Section</div><div style={s.siVal}>{activeObj?.section || '—'}</div></div>
              </div>
              <div style={s.qrSection}>
                <div style={s.qrBox}>
                  <img src={qrImage} alt="QR Code" style={{ width: 200, height: 200 }} />
                </div>
                <div style={s.qrTimer}>Refreshing in {countdown}s</div>
                <div style={s.qrRefreshBar}>
                  <div key={countdown} style={s.qrBarFill} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="cdgi-btn-end" style={s.endBtn} onClick={() => endSession(activeSession)}>
                  ⏹ End Session
                </button>
              </div>
            </div>
          )}

          {/* Sessions history table */}
          <div style={s.card}>
            <div style={s.sectionTitle}>Session History</div>
            <table style={s.table}>
              <thead>
                <tr style={{ background: '#F4F6F9' }}>
                  <th style={s.th}>Subject</th>
                  <th style={s.th}>Room</th>
                  <th style={s.th}>Section</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Time</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s2 => (
                  <tr key={s2.id} className="cdgi-tr">
                    <td style={s.td}>{s2.subjects?.name || '—'}</td>
                    <td style={s.td}>{s2.rooms?.name || '—'}</td>
                    <td style={s.td}>{s2.section || '—'}</td>
                    <td style={s.td}>{s2.date}</td>
                    <td style={s.td}>
                      {s2.start_time ? new Date(s2.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      {s2.end_time ? ` – ${s2.end_time}` : ''}
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...(s2.is_active ? s.badgeGreen : s.badgeGray) }}>
                        {s2.is_active ? 'Active' : 'Ended'}
                      </span>
                    </td>
                    <td style={s.td}>
                      {s2.is_active ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setActiveSession(s2.id)} style={s.smallBtn}>Show QR</button>
                          <button onClick={() => endSession(s2.id)} style={{ ...s.smallBtn, color: '#DC2626', borderColor: '#DC2626' }}>End</button>
                        </div>
                      ) : <span style={{ fontSize: 12, color: '#8A8A8A' }}>Completed</span>}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#8A8A8A', fontSize: 13 }}>No sessions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Session Modal */}
      {showModal && manualMode && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Manual Session</div>
              <button style={s.modalClose} onClick={() => { setShowModal(false); setManualMode(false); }}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#854D0E', marginBottom: 16 }}>
                ⚠ Timetable mein schedule nahi mila? Yahan manually create karo.
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Date</label>
                <input style={s.formInput} type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Subject</label>
                <select style={s.formInput} value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Room</label>
                <select style={s.formInput} value={form.room_id}
                  onChange={e => setForm({ ...form, room_id: e.target.value })}>
                  <option value="">-- Select Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div style={s.formGrid}>
                <div style={s.formRow}>
                  <label style={s.formLabel}>Start Time</label>
                  <select style={s.formInput} value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={s.formRow}>
                  <label style={s.formLabel}>End Time</label>
                  <select style={s.formInput} value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={s.modalFooter}>
              <button className="cdgi-cancel" style={s.btnCancel}
                onClick={() => { setShowModal(false); setManualMode(false); }}>Cancel</button>
              <button className="cdgi-primary" style={s.btnPrimary} onClick={createManual}>
                Generate QR & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  topbar: { background: '#fff', borderBottom: '1px solid #D0D5DF', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  pageTitle: { fontSize: 16, fontWeight: 600, color: '#1A1A1A' },
  topbarDate: { fontSize: 12, color: '#8A8A8A' },
  content: { padding: '24px 28px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: '18px 20px' },
  statLabel: { fontSize: 11, color: '#8A8A8A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 },
  statVal: { fontSize: 28, fontWeight: 600, color: '#1A1A1A' },
  statSub: { fontSize: 11, color: '#8A8A8A', marginTop: 4 },
  newSessionBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 24 },

  // Schedule grid
  card: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#1A1A1A' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  emptySchedule: { textAlign: 'center', padding: '32px 24px', color: '#8A8A8A' },
  scheduleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  slotCard: { border: '1.5px solid #D0D5DF', borderRadius: 8, padding: 14, position: 'relative', transition: 'border-color .2s, background .2s', cursor: 'default' },
  currentBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, marginBottom: 8 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'blink 1.2s infinite' },
  slotPeriod: { fontSize: 10, fontWeight: 600, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 },
  slotTime: { fontSize: 12, fontWeight: 600, color: '#2C3E6B', marginBottom: 8 },
  slotSubject: { fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 },
  slotCode: { fontSize: 11, color: '#8A8A8A', marginBottom: 6 },
  slotRoom: { fontSize: 11, color: '#4A4A4A', marginBottom: 2 },
  slotSection: { fontSize: 11, color: '#4A4A4A', marginBottom: 10 },
  startSlotBtn: { width: '100%', background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
  startedBadge: { width: '100%', textAlign: 'center', background: '#DCFCE7', color: '#16A34A', borderRadius: 6, padding: '8px 0', fontSize: 12, fontWeight: 600 },

  // Active session
  activeCard: { background: '#fff', border: '2px solid #2C3E6B', borderRadius: 6, padding: 20, marginBottom: 24 },
  asHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  asTitle: { fontSize: 14, fontWeight: 600, color: '#2C3E6B' },
  livePill: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#16A34A', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  sessionInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 },
  siItem: { background: '#F4F6F9', borderRadius: 4, padding: '10px 12px' },
  siLabel: { fontSize: 10, color: '#8A8A8A', marginBottom: 3 },
  siVal: { fontSize: 13, fontWeight: 500, color: '#1A1A1A' },
  qrSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 },
  qrBox: { border: '2px solid #2C3E6B', borderRadius: 8, padding: 16, background: '#fff', display: 'inline-block' },
  qrTimer: { fontSize: 12, color: '#8A8A8A' },
  qrRefreshBar: { width: 200, height: 4, background: '#D0D5DF', borderRadius: 2, overflow: 'hidden' },
  qrBarFill: { height: '100%', background: '#2C3E6B', borderRadius: 2, animation: 'barFill 5s linear forwards' },
  endBtn: { background: '#fff', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 6, padding: '9px 20px', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer' },

  // Table
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '.05em', padding: '9px 12px', borderBottom: '1px solid #D0D5DF' },
  td: { padding: '11px 12px', fontSize: 13, borderBottom: '1px solid #D0D5DF', color: '#1A1A1A' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  badgeGreen: { background: '#DCFCE7', color: '#16A34A' },
  badgeGray: { background: '#F1F5F9', color: '#64748B' },
  smallBtn: { padding: '5px 12px', background: '#F4F6F9', border: '1px solid #D0D5DF', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 6, width: 460, maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,.18)' },
  modalHeader: { background: '#2C3E6B', color: '#fff', padding: '16px 20px', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 14, fontWeight: 600 },
  modalClose: { background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1 },
  modalBody: { padding: 20 },
  formRow: { marginBottom: 14 },
  formLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#4A4A4A', marginBottom: 5 },
  formInput: { width: '100%', padding: '9px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#fff' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  modalFooter: { padding: '14px 20px', borderTop: '1px solid #D0D5DF', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  btnCancel: { background: '#fff', border: '1px solid #D0D5DF', color: '#4A4A4A', borderRadius: 4, padding: '9px 18px', fontFamily: "'Poppins',sans-serif", fontSize: 13, cursor: 'pointer' },
  btnPrimary: { background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 20px', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer' },
};
