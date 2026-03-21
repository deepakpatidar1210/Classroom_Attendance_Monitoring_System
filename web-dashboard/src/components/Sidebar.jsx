import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const teacherLinks = [
  { label: 'Dashboard', path: '/teacher',  icon: '⊞' },
  { label: 'Sessions',  path: '/sessions', icon: '📋' },
  { label: 'Students',  path: '/students', icon: '👥' },
  { label: 'Reports',   path: '/reports',  icon: '📊' },
];

const adminLinks = [
  { label: 'Dashboard', path: '/admin',    icon: '⊞' },
  { label: 'Teachers',  path: '/teachers', icon: '👨‍🏫' },
  { label: 'Students',  path: '/students', icon: '👥' },
  { label: 'Rooms',     path: '/rooms',    icon: '🏫' },
  { label: 'Reports',   path: '/reports',  icon: '📊' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : teacherLinks;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .nav-item-btn:hover { background: rgba(255,255,255,.08) !important; color: #fff !important; }
        .logout-btn-cdgi:hover { background: rgba(220,38,38,.2) !important; color: #FCA5A5 !important; }
        .settings-btn:hover { background: rgba(255,255,255,.08) !important; color: #fff !important; }
      `}</style>
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sLogo}>A</div>
          <div style={s.sBrand}>
            AMS — CDGI
            <span style={s.sBrandSub}>Attendance System</span>
          </div>
        </div>

        <nav style={s.navList}>
          {links.map(link => (
            <button key={link.path} className="nav-item-btn"
              onClick={() => navigate(link.path)}
              style={{ ...s.navItem, ...(location.pathname === link.path ? s.navActive : {}) }}>
              <span style={s.navIcon}>{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          {/* Profile card */}
          <div style={s.facultyCard}>
            <div style={s.fAvatar}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.fName}>{user?.name}</div>
              <div style={s.fId}>{user?.role === 'admin' ? 'Administrator' : 'Faculty'}</div>
            </div>
          </div>

          {/* Settings button — sirf teacher ke liye */}
          {user?.role === 'teacher' && (
            <button className="settings-btn"
              onClick={() => navigate('/settings')}
              style={{
                ...s.settingsBtn,
                ...(location.pathname === '/settings' ? s.settingsBtnActive : {}),
              }}>
              <span style={s.navIcon}>⚙️</span> Settings
            </button>
          )}

          {/* Logout */}
          <button className="logout-btn-cdgi" style={s.logoutBtn} onClick={logout}>
            <span>⎋</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

const s = {
  sidebar: { width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, background: '#2C3E6B', display: 'flex', flexDirection: 'column', zIndex: 100, fontFamily: "'Poppins',sans-serif" },
  sidebarTop: { padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10 },
  sLogo: { width: 34, height: 34, borderRadius: '50%', background: '#F0C040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#2C3E6B', flexShrink: 0 },
  sBrand: { color: '#fff', fontSize: 12, fontWeight: 500, lineHeight: 1.3 },
  sBrandSub: { display: 'block', fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 400 },
  navList: { flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,.7)', cursor: 'pointer', marginBottom: 4, border: 'none', background: 'none', width: '100%', textAlign: 'left', fontFamily: "'Poppins',sans-serif" },
  navActive: { background: 'rgba(255,255,255,.15)', color: '#fff', fontWeight: 500 },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 },
  sidebarFooter: { padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,.1)' },
  facultyCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,.08)', marginBottom: 8 },
  fAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#F0C040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2C3E6B', flexShrink: 0 },
  fName: { fontSize: 12, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fId: { fontSize: 10, color: 'rgba(255,255,255,.5)' },
  settingsBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,.7)', cursor: 'pointer', marginBottom: 4, border: 'none', background: 'none', width: '100%', textAlign: 'left', fontFamily: "'Poppins',sans-serif" },
  settingsBtnActive: { background: 'rgba(255,255,255,.15)', color: '#fff', fontWeight: 500 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 6, fontSize: 13, color: 'rgba(255,255,255,.6)', cursor: 'pointer', border: 'none', background: 'none', width: '100%', fontFamily: "'Poppins',sans-serif" },
};
