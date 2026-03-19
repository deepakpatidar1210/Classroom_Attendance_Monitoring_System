import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function Reports() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get(`/sessions/teacher/${user.id}`);
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = async (session_id, sessionName) => {
    try {
      const res = await api.get(`/attendance/session/${session_id}`);
      const rows = res.data;

      const csv = [
        ['Name', 'Enrollment No.', 'Status', 'Marked At'].join(','),
        ...rows.map(r => [
          r.students?.users?.name || '—',
          r.students?.enrollment_no || '—',
          r.status,
          new Date(r.marked_at).toLocaleString('en-IN'),
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${sessionName}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.title}>Reports</h1>
        <p style={styles.sub}>Download attendance reports</p>
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Room</th>
                <th style={styles.th}>Timing</th>
                <th style={styles.th}>Export</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.date}</td>
                  <td style={styles.td}>{s.subjects?.name || '—'}</td>
                  <td style={styles.td}>{s.rooms?.name || '—'}</td>
                  <td style={styles.td}>
                    {s.start_time && s.end_time ? `${s.start_time} - ${s.end_time}` : '—'}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => exportCSV(s.id, s.subjects?.name || 'session')}
                      style={styles.exportBtn}
                    >
                      Export CSV
                    </button>
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
  title: { fontSize: 20, fontWeight: 500, color: '#111', marginBottom: 4 },
  sub: { fontSize: 13, color: '#888', marginBottom: 20 },
  card: { background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: 12, padding: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 500, paddingBottom: 8, borderBottom: '0.5px solid #e8e6e0' },
  td: { padding: '10px 0', fontSize: 13, color: '#111', borderBottom: '0.5px solid #f0ede8' },
  exportBtn: { padding: '5px 12px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
};