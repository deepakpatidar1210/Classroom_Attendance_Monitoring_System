import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SECTIONS = [
  'CS I A','CS I B','CS II A','CS II B','CS III A','CS III B',
  'CS IV A','CS IV B','CS V A','CS V B','CS VI A','CS VI B',
  'CS VII A','CS VII B','CS VIII A','CS VIII B',
  'IT I A','IT I B','IT II A','IT II B',
];

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Rollcall State
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [manualSessionId, setManualSessionId] = useState(null);
  const [manualAttendanceData, setManualAttendanceData] = useState([]);

  useEffect(() => { fetchSessions(); fetchSubjects(); }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/sessions/teacher/${user.id}`);
      setSessions(res.data);
    } catch { toast.error('Could not fetch sessions'); }
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
    } catch { toast.error('Failed to update attendance'); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/sessions/subjects');
      setSubjects(res.data);
    } catch { console.error('subjects fetch failed'); }
  };

  const filtered = sessions.filter(s => {
    if (filterSubject && s.subjects?.name !== filterSubject) return false;
    if (filterDate && s.date !== filterDate) return false;
    return true;
  });

  const getPct = (present, total) => total > 0 ? Math.round((present / total) * 100) : null;

  const badgeStyle = (pct) => {
    if (pct === null) return { background: '#F1F5F9', color: '#64748B' };
    if (pct >= 75) return { background: '#DCFCE7', color: '#16A34A' };
    if (pct >= 60) return { background: '#DBEAFE', color: '#1D4ED8' };
    return { background: '#F1F5F9', color: '#64748B' };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .cdgi-tr:hover { background: #F4F6F9; }
        .cdgi-select:focus, .cdgi-input:focus { border-color: #2C3E6B !important; outline: none; }
      `}</style>
      <Sidebar />
      <div style={LAYOUT}>
        <div style={s.topbar}>
          <div style={s.pageTitle}>Sessions</div>
          <div style={s.topbarDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div style={s.content}>
          <div style={s.card}>
            <div style={s.sectionTitle}>Session History</div>

            {/* Filters — same as HTML */}
            <div style={s.filterRow}>
              <select className="cdgi-select" style={s.filterSelect}
                value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                ))}
              </select>

              <select className="cdgi-select" style={s.filterSelect}
                value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                <option value="">All Sections</option>
                {SECTIONS.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>

              <input className="cdgi-input" style={s.filterDate} type="date"
                value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>

            <table style={s.table}>
              <thead>
                <tr style={{ background: '#F4F6F9' }}>
                  <th style={s.th}>Subject</th>
                  <th style={s.th}>Room</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Time</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="cdgi-tr">
                    <td style={s.td}>{row.subjects?.name || '—'}</td>
                    <td style={s.td}>{row.rooms?.name || '—'}</td>
                    <td style={s.td}>{row.date}</td>
                    <td style={s.td}>
                      {row.start_time
                        ? new Date(row.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                      {row.end_time ? ` – ${row.end_time}` : ''}
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...(row.is_active ? s.badgeGreen : s.badgeGray) }}>
                        {row.is_active ? 'Active' : 'Ended'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {row.is_active
                          ? <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500, marginRight: '8px' }}>Live</span>
                          : <span style={{ fontSize: 12, color: '#8A8A8A', marginRight: '8px' }}>Completed</span>
                        }
                        <button className="btn-primary" onClick={() => openManualAttendance(row.id)} style={{ padding: '6px 12px', background: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '12px', color: 'white', boxShadow: 'none' }}>Rollcall</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#8A8A8A', fontSize: 13 }}>
                      No sessions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Rollcall Modal */}
      {showManualAttendance && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card fade-in" style={{ width: '600px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', background: 'var(--bg-color)', color: 'var(--text-main)' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Manual Rollcall</div>
              <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowManualAttendance(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
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
    </>
  );
}

const LAYOUT = { marginLeft: 220, fontFamily: "'Poppins',sans-serif", background: '#D6DCE4', minHeight: '100vh' };
const s = {
  topbar: { background: '#fff', borderBottom: '1px solid #D0D5DF', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  pageTitle: { fontSize: 16, fontWeight: 600, color: '#1A1A1A' },
  topbarDate: { fontSize: 12, color: '#8A8A8A' },
  content: { padding: '24px 28px' },
  card: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 14 },
  filterRow: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  filterSelect: { padding: '8px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', background: '#fff', minWidth: 160 },
  filterDate: { padding: '8px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', maxWidth: 160 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '.05em', padding: '9px 12px', borderBottom: '1px solid #D0D5DF', background: '#F4F6F9' },
  td: { padding: '11px 12px', fontSize: 13, borderBottom: '1px solid #D0D5DF', color: '#1A1A1A' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  badgeGreen: { background: '#DCFCE7', color: '#16A34A' },
  badgeGray: { background: '#F1F5F9', color: '#64748B' },
};
