import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import api from '../api/axios';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    avgAttendance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [teachersRes, studentsRes, attendanceRes] = await Promise.all([
        api.get('/students/teachers-count'),
        api.get('/students/students-count'),
        api.get('/attendance/avg'),
      ]);
      setStats({
        totalTeachers: teachersRes.data.count || 0,
        totalStudents: studentsRes.data.count || 0,
        avgAttendance: attendanceRes.data.avg || 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: 24, background: '#f7f6f3', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: '#111', marginBottom: 4 }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
          Welcome, {user?.name}
        </p>
        {loading ? (
          <div style={{ color: '#888', fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <StatCard label="Total teachers" value={stats.totalTeachers} />
            <StatCard label="Total students" value={stats.totalStudents} />
            <StatCard label="Avg attendance" value={`${stats.avgAttendance}%`} />
          </div>
        )}
      </div>
    </div>
  );
}
