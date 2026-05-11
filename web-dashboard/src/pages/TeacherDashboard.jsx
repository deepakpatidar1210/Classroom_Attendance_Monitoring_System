import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [activeAttendance, setActiveAttendance] = useState([]);

  // Manual Rollcall state
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [manualSessionId, setManualSessionId] = useState(null);
  const [manualAttendanceData, setManualAttendanceData] = useState([]);

  // Timetable based state
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null); // selected period from schedule
  const [manualMode, setManualMode] = useState(false);

  // Manual form (fallback)
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filter, setFilter] = useState({ dept: '', year: '', sem: '', sectionCode: '' });
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
    fetchDepartments();
    return () => { clearInterval(intervalRef.current); clearInterval(tickRef.current); };
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    generateQR(activeSession);
    intervalRef.current = setInterval(() => { generateQR(activeSession); setCountdown(5); }, 5000);
    tickRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 5), 1000);
    return () => { clearInterval(intervalRef.current); clearInterval(tickRef.current); };
  }, [activeSession]);

  useEffect(() => {
    let poll = null;
    if (activeSession) {
      fetchActiveAttendance();
      poll = setInterval(fetchActiveAttendance, 3000);
    } else {
      setActiveAttendance([]);
    }
    return () => clearInterval(poll);
  }, [activeSession]);

  const fetchActiveAttendance = async () => {
    try {
      const res = await api.get(`/attendance/session/${activeSession}`);
      setActiveAttendance(res.data);
    } catch { console.error('attendance poll failed'); }
  };

  const fetchSessions = async () => {
    try { const res = await api.get(`/sessions/teacher/${user.id}`); setSessions(res.data); }
    catch { toast.error('Could not fetch sessions'); }
  };

  const openManualAttendance = async (session_id) => {
    setManualSessionId(session_id);
    setShowManualAttendance(true);
    try {
      const res = await api.get(`/attendance/session/${session_id}`);
      setManualAttendanceData(res.data);
    } catch { toast.error('Failed to load students'); }
  };

  const submitManualAttendance = async () => {
    try {
      const updates = manualAttendanceData.map(att => ({
        student_id: att.student_id,
        status: att.status
      }));
      await api.patch('/attendance/batch-override', {
        session_id: manualSessionId,
        attendance_data: updates
      });
      toast.success('Attendance updated successfully');
      setShowManualAttendance(false);
      if (manualSessionId === activeSession) fetchActiveAttendance();
    } catch { toast.error('Failed to update attendance'); }
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
  const fetchDepartments = async () => {
    try { const res = await api.get('/students/departments'); setDepartments(res.data); }
    catch { console.error('departments fetch failed'); }
  };

  const generateQR = async (session_id) => {
    try { const res = await api.post('/qr/generate', { session_id }); setQrImage(res.data.qrImage); }
    catch { console.error('QR generate failed'); }
  };

  // session create from time table slot — one click
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

  // Manual session create
  const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
  
  const createManual = async () => {
    if (!form.subject_id || !form.room_id) { toast.error('Please select subject and room'); return; }
    
    const derivedSection = (filter.dept && filter.sem && filter.sectionCode) 
      ? `${filter.dept} ${ROMAN[filter.sem]} ${filter.sectionCode}` : '';
      
    try {
      const res = await api.post('/sessions/create', { ...form, section: derivedSection });
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
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Sidebar />
      <div className="page-container" style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        {/* Top Banner Area */}
        <div style={{ background: 'var(--topbar-gradient)', padding: '32px 32px 48px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px' }}>
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'Faculty'}!
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.9 }}>
                <span>📅 {today}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <NotificationBell userRole="teacher" />
              <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👨‍🏫</span> Faculty Dashboard
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>Today's Sessions</div>
              <div style={{ fontSize: '28px', fontWeight: '700', margin: '4px 0' }}>{todaySessions.length}</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>{todaySessions.filter(s => !s.is_active).length} completed</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>Total Sessions</div>
              <div style={{ fontSize: '28px', fontWeight: '700', margin: '4px 0' }}>{sessions.length}</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>All time</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>Active Session</div>
              <div style={{ fontSize: '28px', fontWeight: '700', margin: '4px 0', color: activeSession ? '#DCFCE7' : 'white' }}>
                {activeSession ? 'LIVE' : 'None'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>{activeSession ? 'QR is running' : 'Start a new session'}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 32px 32px', flex: 1, marginTop: '-24px' }}>

          {/* TODAY'S SCHEDULE — main section */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>📅 Today's Schedule — {todayName}</div>
              <button className="btn-primary" onClick={() => { setManualMode(true); setShowModal(true); }}>
                + Manual Session
              </button>
            </div>

            {scheduleLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading your schedule...
              </div>
            ) : todaySchedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
                <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>No classes scheduled today</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Use "Manual Session" to start a session manually
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {todaySchedule.map((slot, i) => {
                  const isCurrent = isCurrentPeriod(slot);
                  const started = alreadyStarted(slot);
                  const pt = slot.period_timings;
                  return (
                    <div key={i} style={{
                      border: '1px solid',
                      borderColor: isCurrent ? 'var(--primary)' : 'var(--border)',
                      borderRadius: '8px',
                      padding: '16px',
                      background: isCurrent ? '#EEF2FF' : 'var(--surface)',
                      position: 'relative',
                      transition: 'border-color 0.2s, background 0.2s'
                    }}>
                      {isCurrent && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DCFCE7', color: 'var(--success)', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', marginBottom: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', animation: 'blink 1.2s infinite' }} /> NOW
                        </div>
                      )}
                      <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{pt?.label || `Period ${slot.period_no}`}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginBottom: '8px' }}>
                        {pt ? `${pt.start_time.slice(0, 5)} – ${pt.end_time.slice(0, 5)}` : '—'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>
                        {slot.subjects?.name || slot.notes || 'Free'}
                      </div>
                      {slot.subjects?.code && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{slot.subjects.code}</div>
                      )}
                      <div style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '2px' }}>🏫 {slot.rooms?.name || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '12px' }}>👥 {slot.section}</div>

                      {slot.subjects && !started && (
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => createFromSlot(slot)}>
                          ▶ Start Session
                        </button>
                      )}
                      {started && (
                        <div style={{ width: '100%', textAlign: 'center', background: '#DCFCE7', color: 'var(--success)', borderRadius: '6px', padding: '8px 0', fontSize: '12px', fontWeight: '600' }}>✓ Session Started</div>
                      )}
                      {!slot.subjects && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
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
            <div style={{ background: 'var(--surface)', border: '2px solid var(--primary)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary)' }}>
                  {activeObj?.subjects?.name || 'Session'} — Active
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DCFCE7', color: 'var(--success)', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'blink 1.2s infinite' }} />
                  LIVE
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-color)', borderRadius: '6px', padding: '12px 16px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Subject</div><div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{activeObj?.subjects?.name || '—'}</div></div>
                <div style={{ background: 'var(--bg-color)', borderRadius: '6px', padding: '12px 16px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Room</div><div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{activeObj?.rooms?.name || '—'}</div></div>
                <div style={{ background: 'var(--bg-color)', borderRadius: '6px', padding: '12px 16px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Date</div><div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{activeObj?.date}</div></div>
                <div style={{ background: 'var(--bg-color)', borderRadius: '6px', padding: '12px 16px' }}><div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Section</div><div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{activeObj?.section || '—'}</div></div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-color)', padding: '24px', borderRadius: '8px' }}>
                  <div style={{ border: '2px solid var(--primary)', borderRadius: '12px', padding: '16px', background: 'white' }}>
                    <img src={qrImage} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Refreshing in {countdown}s</div>
                  <div style={{ width: '200px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div key={countdown} style={{ height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 1s linear', width: `${(countdown / 5) * 100}%` }} />
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Students Present</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)' }}>{activeAttendance.filter(a => a.status === 'present').length}</div>
                  </div>
                  
                  <div style={{ height: '260px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-color)', position: 'sticky', top: 0 }}>
                          <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>Enrollment</th>
                          <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAttendance.filter(a => a.status === 'present').map((att, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)', fontFamily: 'monospace' }}>{att.students?.enrollment_no}</td>
                            <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)' }}>{att.students?.users?.name}</td>
                          </tr>
                        ))}
                        {activeAttendance.filter(a => a.status === 'present').length === 0 && (
                          <tr>
                            <td colSpan={2} style={{ textAlign: 'center', padding: '32px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              Waiting for students to scan...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '12px' }}>
                <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1.5px solid var(--primary)' }} onClick={() => openManualAttendance(activeSession)}>
                  📝 Manual Rollcall
                </button>
                <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--error)', border: '1.5px solid var(--error)' }} onClick={() => endSession(activeSession)}>
                  ⏹ End Session
                </button>
              </div>
            </div>
          )}

          {/* Sessions history table */}
          <div className="card">
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>Session History</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)' }}>
                  {['Subject', 'Room', 'Section', 'Date', 'Time', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s2 => (
                  <tr key={s2.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{s2.subjects?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)' }}>{s2.rooms?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)' }}>{s2.section || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)' }}>{s2.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)' }}>
                      {s2.start_time ? new Date(s2.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      {s2.end_time ? ` – ${s2.end_time}` : ''}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s2.is_active ? '#DCFCE7' : 'var(--bg-color)', color: s2.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                        {s2.is_active ? 'Active' : 'Ended'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {s2.is_active && <button className="btn-primary" onClick={() => setActiveSession(s2.id)} style={{ padding: '6px 12px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-main)', boxShadow: 'none' }}>Show QR</button>}
                        {s2.is_active && <button className="btn-primary" onClick={() => endSession(s2.id)} style={{ padding: '6px 12px', background: 'var(--error)', border: '1px solid var(--error)', borderRadius: '6px', fontSize: '12px', color: 'white', boxShadow: 'none' }}>End</button>}
                        <button className="btn-primary" onClick={() => openManualAttendance(s2.id)} style={{ padding: '6px 12px', background: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '12px', color: 'white', boxShadow: 'none' }}>Rollcall</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>No sessions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Session Modal */}
      {showModal && manualMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card fade-in" style={{ width: '500px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Manual Session</div>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer' }} onClick={() => { setShowModal(false); setManualMode(false); }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#854D0E', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                <span>⚠</span>
                <span>Schedule not found in Timetable? Create a manual session here.</span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Date</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Start Time</label>
                  <select className="form-input" value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>End Time</label>
                  <select className="form-input" value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Department</label>
                  <select className="form-input" value={filter.dept}
                    onChange={e => setFilter({ dept: e.target.value, year: '', sem: '', sectionCode: '' })}>
                    <option value="">-- Select --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.code}>{d.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Year</label>
                  <select className="form-input" value={filter.year}
                    onChange={e => setFilter(prev => ({ ...prev, year: e.target.value, sem: '', sectionCode: '' }))}
                    disabled={!filter.dept}>
                    <option value="">-- Select --</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Semester</label>
                  <select className="form-input" value={filter.sem}
                    onChange={e => setFilter(prev => ({ ...prev, sem: e.target.value, sectionCode: '' }))}
                    disabled={!filter.year}>
                    <option value="">-- Select --</option>
                    {filter.year === '1' && <><option value="1">Sem 1</option><option value="2">Sem 2</option></>}
                    {filter.year === '2' && <><option value="3">Sem 3</option><option value="4">Sem 4</option></>}
                    {filter.year === '3' && <><option value="5">Sem 5</option><option value="6">Sem 6</option></>}
                    {filter.year === '4' && <><option value="7">Sem 7</option><option value="8">Sem 8</option></>}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Section</label>
                  <select className="form-input" value={filter.sectionCode}
                    onChange={e => setFilter(prev => ({ ...prev, sectionCode: e.target.value }))}
                    disabled={!filter.sem}>
                    <option value="">-- Select --</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Subject</label>
                <select className="form-input" value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">-- Select Subject --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>Room</label>
                <select className="form-input" value={form.room_id}
                  onChange={e => setForm({ ...form, room_id: e.target.value })}>
                  <option value="">-- Select Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-color)' }}>
              <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                onClick={() => { setShowModal(false); setManualMode(false); }}>Cancel</button>
              <button className="btn-primary" onClick={createManual}>
                Generate QR & Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Rollcall Modal */}
      {showManualAttendance && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card fade-in" style={{ width: '600px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Manual Rollcall</div>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowManualAttendance(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto', background: 'var(--bg-color)' }}>
              {manualAttendanceData.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '40px' }}>No students found for this session.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {manualAttendanceData.map(att => (
                    <div key={att.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{att.students?.users?.name || 'Unknown Student'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{att.students?.enrollment_no || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: att.status === 'present' ? 'var(--success)' : 'var(--text-muted)' }}>
                          <input type="radio" name={`status-${att.student_id}`} value="present" checked={att.status === 'present'} 
                            onChange={() => setManualAttendanceData(prev => prev.map(p => p.student_id === att.student_id ? { ...p, status: 'present' } : p))} 
                            style={{ accentColor: 'var(--success)' }} />
                          Present
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: att.status === 'absent' ? 'var(--error)' : 'var(--text-muted)' }}>
                          <input type="radio" name={`status-${att.student_id}`} value="absent" checked={att.status === 'absent'} 
                            onChange={() => setManualAttendanceData(prev => prev.map(p => p.student_id === att.student_id ? { ...p, status: 'absent' } : p))} 
                            style={{ accentColor: 'var(--error)' }} />
                          Absent
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'var(--surface)', alignItems: 'center' }}>
               <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                 Present: <span style={{ fontWeight: '600', color: 'var(--success)' }}>{manualAttendanceData.filter(a => a.status === 'present').length}</span>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => setShowManualAttendance(false)}>Cancel</button>
                 <button className="btn-primary" onClick={submitManualAttendance} disabled={manualAttendanceData.length === 0}>Submit Attendance</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
