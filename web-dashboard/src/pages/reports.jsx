import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const SECTIONS = [
  'CS I A','CS I B','CS II A','CS II B','CS III A','CS III B',
  'CS IV A','CS IV B','CS V A','CS V B','CS VI A','CS VI B',
  'CS VII A','CS VII B','CS VIII A','CS VIII B',
  'IT I A','IT I B','IT II A','IT II B',
];

export default function Reports() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchSessions(); fetchSubjects(); }, []);

  const fetchSessions = async () => {
    try { const res = await api.get(`/sessions/teacher/${user.id}`); setSessions(res.data); }
    catch { console.error('sessions fetch failed'); }
  };

  const fetchSubjects = async () => {
    try { const res = await api.get('/sessions/subjects'); setSubjects(res.data); }
    catch { console.error('subjects fetch failed'); }
  };

  const generateReport = async () => {
    if (!section) { toast.error('Please select a section!'); return; }
    if (!from || !to) { toast.error('Please select date range!'); return; }
    if (from > to) { toast.error('From date must be before To date!'); return; }

    setGenerating(true);

    const filteredSess = sessions.filter(s =>
      (!subject || s.subjects?.name === subject) &&
      s.date >= from && s.date <= to
    );

    if (filteredSess.length === 0) {
      toast.error('No sessions found for selected filters!');
      setGenerating(false);
      return;
    }

    const studentMap = {};

    for (const sess of filteredSess) {
      try {
        const res = await api.get(`/attendance/session/${sess.id}`);
        res.data.forEach(r => {
          const id = r.student_id;
          if (!studentMap[id]) {
            studentMap[id] = {
              name: r.students?.users?.name || '',
              enrollment: r.students?.enrollment_no || '',
              present: 0,
              total: 0,
            };
          }
          studentMap[id].total += 1;
          if (r.status === 'present') studentMap[id].present += 1;
        });
      } catch { console.error('attendance fetch failed for session', sess.id); }
    }

    const studentRows = Object.values(studentMap);

    if (studentRows.length === 0) {
      toast.error('No attendance data found!');
      setGenerating(false);
      return;
    }

    studentRows.sort((a, b) => a.enrollment.localeCompare(b.enrollment));

    // Excel data prepare karo
    const data = studentRows.map((st, idx) => {
      const pct = st.total > 0 ? Math.round((st.present / st.total) * 100) : 0;
      return {
        'Sr. No.': idx + 1,
        'Enrollment No.': st.enrollment,
        'Name': st.name,
        'Attendance %': `${pct}%`,
        'Eligibility': pct >= 60 ? 'Eligible' : 'Not Eligible',
      };
    });

    // Worksheet banao
    const ws = XLSX.utils.json_to_sheet(data);

    // Column widths set karo
    ws['!cols'] = [
      { wch: 8 },   // Sr. No.
      { wch: 18 },  // Enrollment No.
      { wch: 24 },  // Name
      { wch: 14 },  // Attendance %
      { wch: 14 },  // Eligibility
    ];

    // Workbook banao
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    // Download karo
    const filename = `report_${section.replace(/\s/g, '_')}_${from}_to_${to}.xlsx`;
    XLSX.writeFile(wb, filename);

    toast.success('Excel report downloaded!');
    setGenerating(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .cdgi-select:focus, .cdgi-input:focus { border-color: #2C3E6B !important; outline: none; }
        .generate-btn:hover { background: #1e2c50 !important; }
      `}</style>
      <Sidebar />
      <div style={LAYOUT}>
        <div style={s.topbar}>
          <div style={s.pageTitle}>Reports</div>
          <div style={s.topbarDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div style={s.content}>
          <div style={s.reportForm}>
            <div style={s.formTitle}>📊 Generate Attendance Report</div>

            <div style={s.formRow}>
              <label style={s.formLabel}>Section</label>
              <select className="cdgi-select" style={s.formInput}
                value={section} onChange={e => setSection(e.target.value)}>
                <option value="">-- Select Section --</option>
                {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>

            <div style={s.formRow}>
              <label style={s.formLabel}>Subject (optional — leave blank for all)</label>
              <select className="cdgi-select" style={s.formInput}
                value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div style={s.formGrid}>
              <div style={s.formRow}>
                <label style={s.formLabel}>From Date</label>
                <input className="cdgi-input" style={s.formInput} type="date"
                  value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>To Date</label>
                <input className="cdgi-input" style={s.formInput} type="date"
                  value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>

            <button className="generate-btn" style={{
              ...s.generateBtn,
              opacity: generating ? 0.7 : 1,
              cursor: generating ? 'not-allowed' : 'pointer',
            }} onClick={generateReport} disabled={generating}>
              {generating ? '⏳  Generating...' : '⬇  Generate Excel Report'}
            </button>

            <div style={s.note}>
              Excel file mein columns: Sr. No. | Enrollment No. | Name | Attendance % | Eligibility (60%+ = Eligible)
            </div>
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
  reportForm: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 24, maxWidth: 540 },
  formTitle: { fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 20 },
  formRow: { marginBottom: 16 },
  formLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#4A4A4A', marginBottom: 6 },
  formInput: { width: '100%', padding: '9px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', background: '#fff' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  generateBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 22px', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, marginTop: 6 },
  note: { marginTop: 14, fontSize: 11, color: '#8A8A8A', lineHeight: 1.6 },
};
