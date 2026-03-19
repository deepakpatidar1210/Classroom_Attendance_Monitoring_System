import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/students/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.title}>Teachers</h1>
        <p style={styles.sub}>All registered teachers</p>
        <div style={styles.card}>
          {loading ? (
            <div style={{ color: '#888', fontSize: 13, padding: 8 }}>Loading...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Employee ID</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id}>
                    <td style={styles.td}>{t.users?.name || '—'}</td>
                    <td style={styles.td}>{t.users?.email || '—'}</td>
                    <td style={styles.td}>{t.employee_id || '—'}</td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td style={{...styles.td, color: '#888'}} colSpan={3}>No teachers found</td></tr>
                )}
              </tbody>
            </table>
          )}
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
