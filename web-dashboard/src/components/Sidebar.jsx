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
    <aside style={{ width: '240px', background: 'var(--sidebar-bg)', color: 'white', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px' }}>A</div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px' }}>AttendSoft</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>Attendance System</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map(link => {
          const isActive = location.pathname.startsWith(link.path) || (link.path === '/teacher' && location.pathname === '/teacher');
          return (
            <button key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'white', fontSize: '14px', fontWeight: isActive ? '600' : '400',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s'
              }}
              onMouseOver={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '18px' }}>{link.icon}</span>
              {link.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>{user?.role === 'admin' ? 'Administrator' : 'Faculty'}</div>
          </div>
        </div>

        {user?.role === 'teacher' && (
          <button
            onClick={() => navigate('/settings')}
            style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: location.pathname === '/settings' ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: 'white', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', marginBottom: '8px', fontWeight: location.pathname === '/settings' ? '600' : '400' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseOut={e => e.currentTarget.style.background = location.pathname === '/settings' ? 'rgba(255,255,255,0.15)' : 'transparent'}>
            <span style={{ fontSize: '18px' }}>⚙️</span> Settings
          </button>
        )}

        <button style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
          onClick={logout}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <span>⎋</span> Logout
        </button>
      </div>
    </aside>
  );
}
