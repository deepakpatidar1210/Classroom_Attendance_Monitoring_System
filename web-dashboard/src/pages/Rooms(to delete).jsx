import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/sessions/rooms');
      setRooms(res.data);
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
        <h1 style={styles.title}>Rooms & GPS</h1>
        <p style={styles.sub}>All registered classrooms</p>
        <div style={styles.card}>
          {loading ? (
            <div style={{ color: '#888', fontSize: 13, padding: 8 }}>Loading...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Room Name</th>
                  <th style={styles.th}>Latitude</th>
                  <th style={styles.th}>Longitude</th>
                  <th style={styles.th}>Radius (m)</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td style={styles.td}>{r.name || '—'}</td>
                    <td style={styles.td}>{r.latitude || '—'}</td>
                    <td style={styles.td}>{r.longitude || '—'}</td>
                    <td style={styles.td}>{r.radius_meters || '—'}</td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr><td style={{...styles.td, color: '#888'}} colSpan={4}>No rooms found</td></tr>
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
