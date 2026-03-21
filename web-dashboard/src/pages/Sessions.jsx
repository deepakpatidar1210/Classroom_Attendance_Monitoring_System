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

  useEffect(() => { fetchSessions(); fetchSubjects(); }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/sessions/teacher/${user.id}`);
      setSessions(res.data);
    } catch { toast.error('Could not fetch sessions'); }
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
                      {row.is_active
                        ? <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>Live</span>
                        : <span style={{ fontSize: 12, color: '#8A8A8A' }}>Completed</span>
                      }
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
