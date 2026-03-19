import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function Students() {
  const [students, setStudents] = useState([]);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students/all');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.title}>Students</h1>
        <p style={styles.sub}>All registered students</p>
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Enrollment No.</th>
                <th style={styles.th}>Semester</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.users?.name || '—'}</td>
                  <td style={styles.td}>{s.users?.email || '—'}</td>
                  <td style={styles.td}>{s.enrollment_no}</td>
                  <td style={styles.td}>Sem {s.semester}</td>
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
};