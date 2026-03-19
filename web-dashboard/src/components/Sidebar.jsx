import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const teacherLinks = [
  { label: 'Dashboard', path: '/teacher' },
  { label: 'Sessions', path: '/sessions' },
  { label: 'Students', path: '/students' },
  { label: 'Reports', path: '/reports' },
];

const adminLinks = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Teachers', path: '/teachers' },
  { label: 'Students', path: '/students' },
  { label: 'Rooms & GPS', path: '/rooms' },
  { label: 'Reports', path: '/reports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : teacherLinks;

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoText}>AttendX</div>
        <div style={styles.logoSub}>{user?.role} portal</div>
      </div>

      <nav style={styles.nav}>
        {links.map(link => (
          <div
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              ...styles.link,
              ...(location.pathname === link.path ? styles.active : {})
            }}
          >
            {link.label}
          </div>
        ))}
      </nav>

      <div style={styles.bottom}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.charAt(0)}</div>
          <div>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: { width: 200, background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 },
  logo: { padding: '0 16px 20px', borderBottom: '0.5px solid #2a2a2a', marginBottom: 8 },
  logoText: { fontSize: 16, fontWeight: 500, color: '#fff' },
  logoSub: { fontSize: 11, color: '#666', marginTop: 2 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 0' },
  link: { padding: '10px 16px', fontSize: 13, color: '#666', cursor: 'pointer' },
  active: { color: '#fff', background: '#222' },
  bottom: { padding: '16px', borderTop: '0.5px solid #2a2a2a' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500 },
  userName: { fontSize: 12, fontWeight: 500, color: '#fff' },
  userRole: { fontSize: 11, color: '#666' },
  logoutBtn: { width: '100%', padding: '7px', background: 'transparent', border: '0.5px solid #333', color: '#666', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
};