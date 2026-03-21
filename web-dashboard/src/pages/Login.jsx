import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
 
export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [passChecks, setPassChecks] = useState({
    len: false, upper: false, lower: false, num: false, special: false,
  });
 
  const checkPassword = (val) => {
    setPassChecks({
      len:     val.length >= 8,
      upper:   /[A-Z]/.test(val),
      lower:   /[a-z]/.test(val),
      num:     /[0-9]/.test(val),
      special: /[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(val),
    });
  };
 
  const handlePasswordChange = (val) => {
    setPassword(val);
    checkPassword(val);
  };
 
  const handleLogin = async () => {
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
 
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };
 
  const HintRow = ({ ok, text }) => (
    <div style={{ ...s.hint, color: ok ? '#16A34A' : '#DC2626' }}>• {text}</div>
  );
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .cdgi-body * { box-sizing: border-box; margin: 0; padding: 0; }
        .cdgi-login-btn:hover { background: #1e2c50 !important; }
        .cdgi-input:focus { border-color: #2C3E6B !important; outline: none; }
        .cdgi-link:hover { text-decoration: underline; }
        .cdgi-radio { accent-color: #2C3E6B; width: 14px; height: 14px; cursor: pointer; }
      `}</style>
 
      <div className="cdgi-body" style={s.body}>
        <div style={s.card}>
 
          {/* Topbar */}
          <div style={s.topbar}>
            <div style={s.topbarIcon}>A</div>
            <div style={s.topbarTitle}>Attendance Monitoring System</div>
          </div>
 
          {/* Card body */}
          <div style={s.cardBody}>
 
            {/* Logo */}
            <div style={s.logoWrap}>
              <img
                src="https://upload.wikimedia.org/wikipedia/en/thumb/0/08/Chameli_Devi_Group_of_Institutions_logo.png/220px-Chameli_Devi_Group_of_Institutions_logo.png"
                alt="CDGI Logo"
                style={s.logo}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ ...s.logoFallback, display: 'none' }}>CDGI</div>
            </div>
 
            {/* Role */}
            <div style={s.roleRow}>
              <label style={s.roleLabel}>
                <input className="cdgi-radio" type="radio" name="role" value="admin"
                  checked={role === 'admin'} onChange={() => setRole('admin')} />
                Admin
              </label>
              <label style={s.roleLabel}>
                <input className="cdgi-radio" type="radio" name="role" value="teacher"
                  checked={role === 'teacher'} onChange={() => setRole('teacher')} />
                Faculty
              </label>
            </div>
 
            {/* Email */}
            <div style={s.inputGroup}>
              <input
                className="cdgi-input"
                style={s.input}
                type="email"
                placeholder={role === 'admin' ? 'Admin Email' : 'Faculty Email (eg. faculty@cdgi.ac.in)'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
 
            {/* Password */}
            <div style={s.inputGroup}>
              <div style={s.passWrap}>
                <input
                  className="cdgi-input"
                  style={{ ...s.input, paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  onFocus={() => setShowHints(true)}
                  onKeyDown={handleKeyDown}
                />
                <button style={s.eyeBtn} type="button" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
 
              {showHints && (
                <div style={s.hints}>
                  <HintRow ok={passChecks.len}     text="Minimum 8 characters" />
                  <HintRow ok={passChecks.upper}   text="At least 1 uppercase letter (A-Z)" />
                  <HintRow ok={passChecks.lower}   text="At least 1 lowercase letter (a-z)" />
                  <HintRow ok={passChecks.num}     text="At least 1 number (0-9)" />
                  <HintRow ok={passChecks.special} text="At least 1 special character (!@#$ etc.)" />
                </div>
              )}
            </div>
 
            {/* Forgot password */}
            <div style={s.linksRow}>
              <button className="cdgi-link" style={s.linkBtn} type="button">
                Forgot Password?
              </button>
            </div>
 
            {/* Login btn */}
            <button
              className="cdgi-login-btn"
              style={s.loginBtn}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login »'}
            </button>
 
          </div>
        </div>
      </div>
    </>
  );
}
 
const s = {
  body: {
    fontFamily: "'Poppins', sans-serif",
    background: '#D6DCE4',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    width: 420,
    borderRadius: 4,
    overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(0,0,0,.12)',
  },
  topbar: {
    background: '#2C3E6B',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  topbarIcon: {
    width: 30, height: 30,
    borderRadius: '50%',
    background: '#F0C040',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 700, color: '#2C3E6B', flexShrink: 0,
  },
  topbarTitle: { color: '#fff', fontSize: 14, fontWeight: 500, letterSpacing: 0.2 },
  cardBody: { padding: '28px 36px 36px', textAlign: 'center' },
  logoWrap: { marginBottom: 18 },
  logo: { width: 115, height: 115, objectFit: 'contain', borderRadius: '50%' },
  logoFallback: {
    width: 115, height: 115, borderRadius: '50%',
    background: '#2C3E6B', margin: '0 auto',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 24, fontWeight: 700,
  },
  roleRow: { display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 18 },
  roleLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#333', cursor: 'pointer' },
  inputGroup: { marginBottom: 13, textAlign: 'left' },
  input: {
    width: '100%', padding: '11px 14px',
    border: '1px solid #C8CDD6', borderRadius: 4,
    fontFamily: "'Poppins', sans-serif",
    fontSize: 13, color: '#333', transition: 'border-color .2s',
  },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#AAB0BB',
  },
  hints: { marginTop: 6, textAlign: 'left' },
  hint: { fontSize: 11, lineHeight: 1.7 },
  linksRow: { display: 'flex', justifyContent: 'flex-start', marginBottom: 16 },
  linkBtn: {
    fontSize: 12, color: '#2563EB', background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: "'Poppins', sans-serif", padding: 0,
  },
  loginBtn: {
    background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 4,
    padding: '11px 36px', fontFamily: "'Poppins', sans-serif",
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    transition: 'background .2s', letterSpacing: 0.3,
  },
};
 