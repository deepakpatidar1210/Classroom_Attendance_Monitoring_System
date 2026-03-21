import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const SECTIONS = [
  'CS I A','CS I B','CS II A','CS II B','CS III A','CS III B',
  'CS IV A','CS IV B','CS V A','CS V B','CS VI A','CS VI B',
  'CS VII A','CS VII B','CS VIII A','CS VIII B',
  'IT I A','IT I B','IT II A','IT II B',
];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [filterSection, setFilterSection] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students/all');
      setStudents(res.data);
      // Fetch attendance % for each student
      fetchAttendancePct(res.data);
    } catch { console.error('Could not fetch students'); }
  };

  const fetchAttendancePct = async (studentList) => {
    const pctMap = {};
    await Promise.all(studentList.map(async (st) => {
      try {
        const res = await api.get(`/attendance/student/${st.id}`);
        const records = res.data;
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        pctMap[st.id] = total > 0 ? Math.round((present / total) * 100) : null;
      } catch {
        pctMap[st.id] = null;
      }
    }));
    setAttendance(pctMap);
  };

  const getStatus = (pct) => {
    if (pct === null) return { label: '—', color: '#8A8A8A', bg: 'transparent' };
    if (pct >= 75) return { label: 'Safe', color: '#16A34A', bg: '#DCFCE7' };
    if (pct >= 65) return { label: 'Warning', color: '#1D4ED8', bg: '#DBEAFE' };
    return { label: 'Critical', color: '#DC2626', bg: '#FEF2F2' };
  };

  const filtered = students.filter(st => {
    const q = search.trim().toUpperCase();
    const matchSearch = !q ||
      (st.enrollment_no || '').toUpperCase().includes(q) ||
      (st.users?.name || '').toUpperCase().includes(q);
    return matchSearch;
  });

  const exportCSV = () => {
    const csv = [
      ['Enrollment No.', 'Name', 'Semester', 'Attendance %', 'Status'].join(','),
      ...filtered.map(st => {
        const pct = attendance[st.id];
        const status = getStatus(pct);
        return [
          st.enrollment_no,
          st.users?.name || '—',
          `Sem ${st.semester}`,
          pct !== null ? `${pct}%` : '—',
          status.label,
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .cdgi-tr:hover { background: #F4F6F9; }
        .cdgi-select:focus, .cdgi-input:focus { border-color: #2C3E6B !important; outline: none; }
        .export-btn:hover { background: #1e2c50 !important; }
      `}</style>
      <Sidebar />
      <div style={LAYOUT}>
        <div style={s.topbar}>
          <div style={s.pageTitle}>Students</div>
          <div style={s.topbarDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div style={s.content}>
          <div style={s.card}>
            <div style={s.sectionTitle}>Student List</div>

            {/* Filters */}
            <div style={s.filterRow}>
              <select className="cdgi-select" style={s.filterSelect}
                value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                <option value="">All Sections</option>
                {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>

              <input className="cdgi-input" style={s.searchInput} type="text"
                placeholder="Search by enrollment (eg. 0832CS231001)"
                value={search} onChange={e => setSearch(e.target.value)} />

              <button className="export-btn" style={s.exportBtn} onClick={exportCSV}>
                ⬇ Export CSV
              </button>
            </div>

            <table style={s.table}>
              <thead>
                <tr style={{ background: '#F4F6F9' }}>
                  <th style={s.th}>Enrollment</th>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Semester</th>
                  <th style={s.th}>Overall %</th>
                  <th style={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(st => {
                  const pct = attendance[st.id];
                  const status = getStatus(pct);
                  return (
                    <tr key={st.id} className="cdgi-tr">
                      <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{st.enrollment_no}</td>
                      <td style={s.td}>{st.users?.name || '—'}</td>
                      <td style={s.td}>Sem {st.semester}</td>
                      <td style={s.td}>
                        {pct !== null ? (
                          <span style={{ ...s.badge, background: status.bg, color: status.color }}>
                            {pct}%
                          </span>
                        ) : <span style={{ color: '#8A8A8A', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ ...s.td, color: status.color, fontWeight: pct !== null ? 500 : 400 }}>
                        {status.label}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#8A8A8A', fontSize: 13 }}>
                      No students found
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
  filterRow: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  filterSelect: { padding: '8px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', background: '#fff' },
  searchInput: { flex: 1, minWidth: 260, padding: '8px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '.05em', padding: '9px 12px', borderBottom: '1px solid #D0D5DF', background: '#F4F6F9' },
  td: { padding: '11px 12px', fontSize: 13, borderBottom: '1px solid #D0D5DF', color: '#1A1A1A' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
};
