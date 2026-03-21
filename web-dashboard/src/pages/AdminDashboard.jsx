import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import TimetableManager from '../components/TimetableManager';

const SECTIONS_MAP = {
  CS: ['CS I A','CS I B','CS II A','CS II B','CS III A','CS III B','CS IV A','CS IV B','CS V A','CS V B','CS VI A','CS VI B','CS VII A','CS VII B','CS VIII A','CS VIII B'],
  IT: ['IT I A','IT I B','IT II A','IT II B','IT III A','IT III B','IT IV A','IT IV B'],
  EC: ['EC I A','EC I B','EC II A','EC II B','EC III A','EC III B','EC IV A','EC IV B'],
  ME: ['ME I A','ME I B','ME II A','ME II B','ME III A','ME III B','ME IV A','ME IV B'],
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ teachers: 0, students: 0, rooms: 0, avg: 0 });
  const [departments, setDepartments] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [facDept, setFacDept] = useState('ALL');
  const [showAddFac, setShowAddFac] = useState(false);
  const [facForm, setFacForm] = useState({ name: '', email: '', mobile: '', department_id: '' });
  const [facErrors, setFacErrors] = useState({});
  const [genCreds, setGenCreds] = useState(null);
  const [credStep, setCredStep] = useState(1);

  const [students, setStudents] = useState([]);
  const [stuLevel, setStuLevel] = useState('dept');
  const [stuDept, setStuDept] = useState('');
  const [stuDeptName, setStuDeptName] = useState('');
  const [stuSection, setStuSection] = useState('');
  const [stuAttendance, setStuAttendance] = useState({});

  const [rooms, setRooms] = useState([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', type: 'Classroom', latitude: '', longitude: '', radius_meters: '' });
  const [roomErrors, setRoomErrors] = useState({});

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchDepartments();
    fetchTeachers();
    fetchStudents();
    fetchRooms();
  }, []);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      teachers: teachers.length,
      students: students.length,
      rooms: rooms.length,
    }));
  }, [teachers, students, rooms]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/students/departments');
      setDepartments(res.data);
    } catch {
      // Fallback — agar route nahi hai to hardcode
      setDepartments([
        { id: 'fd1e3235-48d4-4b08-bfd4-4af05a53ff91', name: 'Computer Science (CSE)' },
      ]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/students/teachers');
      setTeachers(res.data);
    } catch { console.error('teachers fetch failed'); }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students/all');
      setStudents(res.data);
    } catch { console.error('students fetch failed'); }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/sessions/rooms');
      setRooms(res.data);
    } catch { console.error('rooms fetch failed'); }
  };

  const fetchStuAttendance = async (studentList) => {
    const map = {};
    await Promise.all(studentList.map(async (st) => {
      try {
        const res = await api.get(`/attendance/student/${st.id}`);
        const total = res.data.length;
        const present = res.data.filter(r => r.status === 'present').length;
        map[st.id] = total > 0 ? Math.round((present / total) * 100) : null;
      } catch { map[st.id] = null; }
    }));
    setStuAttendance(map);
  };

  // ---- FACULTY VALIDATION ----
  const validateFacForm = () => {
    const errs = {};
    if (!facForm.name.trim()) errs.name = 'Name required';
    if (!facForm.email.trim()) errs.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facForm.email)) errs.email = 'Invalid email format';
    if (!facForm.mobile.trim()) errs.mobile = 'Mobile required';
    else if (!/^\d{10}$/.test(facForm.mobile)) errs.mobile = 'Must be exactly 10 digits';
    if (!facForm.department_id) errs.department_id = 'Select department';
    setFacErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const nums = '23456789';
    const special = '@#$!';
    let pass = upper[Math.floor(Math.random() * upper.length)]
      + lower[Math.floor(Math.random() * lower.length)]
      + lower[Math.floor(Math.random() * lower.length)]
      + nums[Math.floor(Math.random() * nums.length)]
      + nums[Math.floor(Math.random() * nums.length)]
      + special[Math.floor(Math.random() * special.length)]
      + upper[Math.floor(Math.random() * upper.length)]
      + lower[Math.floor(Math.random() * lower.length)];
    return pass.split('').sort(() => Math.random() - .5).join('');
  };

  const handleGenCreds = () => {
    if (!validateFacForm()) return;
    const password = generatePassword();
    setGenCreds({ email: facForm.email, password });
    setCredStep(2);
  };

  const handleAddFaculty = async () => {
    try {
      await api.post('/auth/register', {
        name: facForm.name,
        email: facForm.email,
        password: genCreds.password,
        role: 'teacher',
        employee_id: `FAC${String(teachers.length + 1).padStart(3, '0')}`,
        department_id: facForm.department_id,
      });
      toast.success('Faculty added successfully!');
      setShowAddFac(false);
      setFacForm({ name: '', email: '', mobile: '', department_id: '' });
      setGenCreds(null);
      setCredStep(1);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add faculty');
    }
  };

  // ---- ROOM VALIDATION ----
  const validateRoomForm = () => {
    const errs = {};
    if (!roomForm.name.trim()) errs.name = 'Room name required';
    if (!roomForm.latitude) errs.latitude = 'Latitude required';
    else if (isNaN(roomForm.latitude)) errs.latitude = 'Must be a number';
    if (!roomForm.longitude) errs.longitude = 'Longitude required';
    else if (isNaN(roomForm.longitude)) errs.longitude = 'Must be a number';
    if (!roomForm.radius_meters) errs.radius_meters = 'Radius required';
    else if (isNaN(roomForm.radius_meters) || Number(roomForm.radius_meters) < 5) errs.radius_meters = 'Min 5 meters';
    setRoomErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddRoom = async () => {
    if (!validateRoomForm()) return;
    try {
      await api.post('/sessions/rooms/add', {
        name: roomForm.name,
        type: roomForm.type,
        latitude: parseFloat(roomForm.latitude),
        longitude: parseFloat(roomForm.longitude),
        radius_meters: parseInt(roomForm.radius_meters),
      });
      toast.success('Room added successfully!');
      setShowAddRoom(false);
      setRoomForm({ name: '', type: 'Classroom', latitude: '', longitude: '', radius_meters: '' });
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add room');
    }
  };

  const getStatus = (pct) => {
    if (pct === null || pct === undefined) return { label: '—', color: '#8A8A8A', bg: 'transparent' };
    if (pct >= 75) return { label: 'Safe', color: '#16A34A', bg: '#DCFCE7' };
    if (pct >= 65) return { label: 'Warning', color: '#D97706', bg: '#FEF3C7' };
    return { label: 'Critical', color: '#DC2626', bg: '#FEF2F2' };
  };

  const navTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { key: 'faculties', label: 'Faculties', icon: '👨‍🏫' },
    { key: 'students', label: 'Students', icon: '👥' },
    { key: 'rooms', label: 'Rooms', icon: '🚪' },
    { key: 'timetable', label: 'Timetable', icon: '📅' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        .adm * { font-family: 'Poppins', sans-serif; box-sizing: border-box; }
        .nav-btn:hover { background: rgba(255,255,255,.08) !important; color: #fff !important; }
        .logout-cdgi:hover { background: rgba(220,38,38,.2) !important; color: #FCA5A5 !important; }
        .dept-tab-btn:hover { border-color: #2C3E6B !important; color: #2C3E6B !important; }
        .btn-pri:hover { background: #1e2c50 !important; }
        .btn-exp:hover { background: #15803D !important; }
        .btn-dng:hover { background: #FEF2F2 !important; }
        .btn-cancel:hover { background: #F4F6F9 !important; }
        .dept-card:hover { border-color: #2C3E6B !important; box-shadow: 0 2px 8px rgba(44,62,107,.1) !important; }
        .sec-card:hover { border-color: #2C3E6B !important; background: #F4F6F9 !important; }
        .cdgi-tr:hover { background: #F4F6F9; }
        .cdgi-input:focus, .cdgi-select:focus { border-color: #2C3E6B !important; outline: none; }
        .mini-bar-fill { height: 100%; border-radius: 4px; background: #2C3E6B; }
      `}</style>

      <div className="adm">
        {/* SIDEBAR */}
        <aside style={s.sidebar}>
          <div style={s.sidebarTop}>
            <div style={s.sLogo}>A</div>
            <div style={s.sBrand}>AMS — CDGI<span style={s.sBrandSub}>Admin Panel</span></div>
          </div>
          <nav style={s.navList}>
            {navTabs.map(tab => (
              <button key={tab.key} className="nav-btn"
                onClick={() => setActiveTab(tab.key)}
                style={{ ...s.navItem, ...(activeTab === tab.key ? s.navActive : {}) }}>
                <span style={s.navIcon}>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
          <div style={s.sidebarFooter}>
            <div style={s.adminCard}>
              <div style={s.aAvatar}>{user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'}</div>
              <div>
                <div style={s.aName}>{user?.name || 'Administrator'}</div>
                <div style={s.aId}>Administrator</div>
              </div>
            </div>
            <button className="logout-cdgi" style={s.logoutBtn} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
              <span>⎋</span> Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div style={s.main}>
          <div style={s.topbar}>
            <div style={s.pageTitle}>{navTabs.find(t => t.key === activeTab)?.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={s.topbarDate}>{today}</div>
              <span style={s.adminBadge}>Admin</span>
            </div>
          </div>

          <div style={s.content}>

            {/* ===== DASHBOARD ===== */}
            {activeTab === 'dashboard' && (
              <div>
                <div style={s.statsGrid}>
                  <div style={{ ...s.statCard, background: '#2C3E6B' }}>
                    <div style={{ ...s.statLabel, color: 'rgba(255,255,255,.6)' }}>Total Students</div>
                    <div style={{ ...s.statVal, color: '#fff' }}>{stats.students}</div>
                    <div style={{ ...s.statSub, color: 'rgba(255,255,255,.5)' }}>Registered students</div>
                  </div>
                  <div style={s.statCard}>
                    <div style={s.statLabel}>Total Faculties</div>
                    <div style={s.statVal}>{stats.teachers}</div>
                    <div style={s.statSub}>Active teaching staff</div>
                  </div>
                  <div style={s.statCard}>
                    <div style={s.statLabel}>Total Rooms</div>
                    <div style={s.statVal}>{stats.rooms}</div>
                    <div style={s.statSub}>Classrooms + Labs</div>
                  </div>
                  <div style={s.statCard}>
                    <div style={s.statLabel}>Avg. Attendance</div>
                    <div style={s.statVal}>{stats.avg}%</div>
                    <div style={s.statSub}>Overall average</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={s.card}>
                    <div style={s.sectionTitle}>Department-wise Attendance</div>
                    {[{ label: 'CS', pct: 84 }, { label: 'IT', pct: 79 }, { label: 'EC', pct: 87 }, { label: 'ME', pct: 76 }].map(d => (
                      <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: '#4A4A4A', width: 80, flexShrink: 0 }}>{d.label}</div>
                        <div style={{ flex: 1, height: 8, background: '#F4F6F9', borderRadius: 4, overflow: 'hidden' }}>
                          <div className="mini-bar-fill" style={{ width: `${d.pct}%` }} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', width: 36, textAlign: 'right' }}>{d.pct}%</div>
                      </div>
                    ))}
                  </div>
                  <div style={s.card}>
                    <div style={s.sectionTitle}>Recent Activity</div>
                    {[
                      { color: '#16A34A', text: 'New faculty added successfully', time: 'Today, 10:30 AM' },
                      { color: '#2C3E6B', text: 'Room GPS coordinates updated', time: 'Today, 09:15 AM' },
                      { color: '#D97706', text: 'Attendance report exported', time: 'Yesterday, 4:00 PM' },
                      { color: '#16A34A', text: 'New room added successfully', time: 'Yesterday, 2:20 PM' },
                    ].map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid #D0D5DF' : 'none' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, color: '#1A1A1A' }}>{a.text}</div>
                          <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 2 }}>{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== FACULTIES ===== */}
            {activeTab === 'faculties' && (
              <div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                  {['ALL', ...departments.map(d => d.name)].map((d, i) => (
                    <button key={i} className="dept-tab-btn"
                      onClick={() => setFacDept(d)}
                      style={{ ...s.deptTab, ...(facDept === d ? s.deptTabActive : {}) }}>
                      {d === 'ALL' ? 'All' : d}
                    </button>
                  ))}
                </div>

                <div style={s.card}>
                  <div style={s.sectionHeader}>
                    <div style={{ ...s.sectionTitle, marginBottom: 0 }}>Faculty List</div>
                    <button className="btn-pri" style={s.btnPrimary}
                      onClick={() => { setShowAddFac(true); setCredStep(1); setGenCreds(null); setFacForm({ name: '', email: '', mobile: '', department_id: '' }); setFacErrors({}); }}>
                      + Add Faculty
                    </button>
                  </div>
                  <table style={s.table}>
                    <thead>
                      <tr style={{ background: '#F4F6F9' }}>
                        {['Employee ID', 'Name', 'Email', 'Action'].map(h => <th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map(t => (
                        <tr key={t.id} className="cdgi-tr">
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{t.employee_id || '—'}</td>
                          <td style={{ ...s.td, fontWeight: 500 }}>{t.users?.name || '—'}</td>
                          <td style={s.td}>{t.users?.email || '—'}</td>
                          <td style={s.td}>
                            <button className="btn-dng" style={s.btnDanger}
                              onClick={() => toast.error('Remove feature coming soon')}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {teachers.length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#8A8A8A', fontSize: 13 }}>No faculties found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== STUDENTS ===== */}
            {activeTab === 'students' && (
              <div>
                {stuLevel !== 'dept' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontSize: 13, color: '#8A8A8A' }}>
                    <span style={{ color: '#2C3E6B', fontWeight: 500, cursor: 'pointer' }}
                      onClick={() => { setStuLevel('dept'); setStuDept(''); setStuSection(''); }}>
                      Departments
                    </span>
                    {stuDept && <>
                      <span>›</span>
                      <span style={{ color: stuLevel === 'list' ? '#2C3E6B' : '#1A1A1A', fontWeight: 500, cursor: stuLevel === 'list' ? 'pointer' : 'default' }}
                        onClick={() => stuLevel === 'list' && setStuLevel('section')}>
                        {stuDeptName}
                      </span>
                    </>}
                    {stuSection && <><span>›</span><span style={{ color: '#1A1A1A' }}>{stuSection}</span></>}
                  </div>
                )}

                {/* Level 1: Departments */}
                {stuLevel === 'dept' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                    {[
                      { key: 'CS', name: 'Computer Science', icon: '💻' },
                      { key: 'IT', name: 'Information Technology', icon: '🖧' },
                      { key: 'EC', name: 'Electronics', icon: '⚡' },
                      { key: 'ME', name: 'Mechanical', icon: '⚙️' },
                    ].map(d => {
                      const count = students.filter(s => (s.enrollment_no || '').toUpperCase().includes(d.key)).length;
                      return (
                        <div key={d.key} className="dept-card" style={s.deptCard}
                          onClick={() => { setStuDept(d.key); setStuDeptName(d.name); setStuLevel('section'); }}>
                          <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{d.name}</div>
                          <div style={{ fontSize: 12, color: '#8A8A8A' }}>{count} students</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Level 2: Sections */}
                {stuLevel === 'section' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {(SECTIONS_MAP[stuDept] || []).map(sec => {
                      const semNum = ['I','II','III','IV','V','VI','VII','VIII'].indexOf(sec.split(' ')[1]) + 1;
                      const secStuds = students.filter(st =>
                        (st.enrollment_no || '').toUpperCase().includes(stuDept) &&
                        st.semester === semNum
                      );
                      return (
                        <div key={sec} className="sec-card" style={s.secCard}
                          onClick={() => {
                            setStuSection(sec);
                            setStuLevel('list');
                            fetchStuAttendance(secStuds);
                          }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#2C3E6B', marginBottom: 4 }}>{sec}</div>
                          <div style={{ fontSize: 12, color: '#8A8A8A' }}>{secStuds.length} students</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Level 3: Students list */}
                {stuLevel === 'list' && (() => {
                  const semNum = ['I','II','III','IV','V','VI','VII','VIII'].indexOf(stuSection.split(' ')[1]) + 1;
                  const secStuds = students.filter(st =>
                    (st.enrollment_no || '').toUpperCase().includes(stuDept) &&
                    st.semester === semNum
                  );
                  return (
                    <div style={s.card}>
                      <div style={s.sectionHeader}>
                        <div style={{ ...s.sectionTitle, marginBottom: 0 }}>{stuSection} — Students ({secStuds.length})</div>
                        <button className="btn-exp" style={s.btnExport}>⬇ Export Excel</button>
                      </div>
                      <table style={s.table}>
                        <thead>
                          <tr style={{ background: '#F4F6F9' }}>
                            {['Enrollment No.', 'Name', 'Semester', 'Attendance %', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {secStuds.map(st => {
                            const pct = stuAttendance[st.id];
                            const status = getStatus(pct);
                            return (
                              <tr key={st.id} className="cdgi-tr">
                                <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{st.enrollment_no}</td>
                                <td style={{ ...s.td, fontWeight: 500 }}>{st.users?.name || '—'}</td>
                                <td style={s.td}>Sem {st.semester}</td>
                                <td style={s.td}>
                                  {pct !== null && pct !== undefined ? (
                                    <span style={{ ...s.badge, background: status.bg, color: status.color }}>{pct}%</span>
                                  ) : <span style={{ color: '#8A8A8A', fontSize: 12 }}>—</span>}
                                </td>
                                <td style={{ ...s.td, color: status.color, fontWeight: pct !== null ? 500 : 400 }}>{status.label}</td>
                              </tr>
                            );
                          })}
                          {secStuds.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#8A8A8A', fontSize: 13 }}>No students in this section</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ===== ROOMS ===== */}
            {activeTab === 'rooms' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>Rooms & Labs</div>
                  <button className="btn-pri" style={s.btnPrimary}
                    onClick={() => { setShowAddRoom(true); setRoomErrors({}); setRoomForm({ name: '', type: 'Classroom', latitude: '', longitude: '', radius_meters: '' }); }}>
                    + Add Room
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {rooms.map((r, i) => (
                    <div key={i} style={s.roomCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#2C3E6B' }}>{r.name}</div>
                        <span style={{ ...s.badge, background: '#EEF2FF', color: '#2C3E6B' }}>
                          {r.type || 'Classroom'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 2 }}>📍 {r.latitude}, {r.longitude}</div>
                      <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 2 }}>🎯 Radius: {r.radius_meters}m</div>
                    </div>
                  ))}
                  {rooms.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#8A8A8A', fontSize: 13 }}>No rooms added yet</div>
                  )}
                </div>
              </div>
            )}

            {/* ===== TIMETABLE ===== */}
            {activeTab === 'timetable' && (
              <div style={{ background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 20 }}>
                <TimetableManager />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ===== ADD FACULTY MODAL ===== */}
      {showAddFac && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Add New Faculty</div>
              <button style={s.modalClose} onClick={() => setShowAddFac(false)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formRow}>
                <label style={s.formLabel}>Full Name</label>
                <input className="cdgi-input" style={{ ...s.formInput, ...(facErrors.name ? s.inputErr : {}) }}
                  type="text" placeholder="Prof. Full Name"
                  value={facForm.name} onChange={e => setFacForm({ ...facForm, name: e.target.value })} />
                {facErrors.name && <div style={s.errMsg}>{facErrors.name}</div>}
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Email Address</label>
                <input className="cdgi-input" style={{ ...s.formInput, ...(facErrors.email ? s.inputErr : {}) }}
                  type="email" placeholder="faculty@cdgi.ac.in"
                  value={facForm.email} onChange={e => setFacForm({ ...facForm, email: e.target.value })} />
                {facErrors.email && <div style={s.errMsg}>{facErrors.email}</div>}
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Mobile Number</label>
                <input className="cdgi-input" style={{ ...s.formInput, ...(facErrors.mobile ? s.inputErr : {}) }}
                  type="tel" placeholder="10-digit mobile number" maxLength={10}
                  value={facForm.mobile}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); setFacForm({ ...facForm, mobile: v }); }} />
                {facErrors.mobile && <div style={s.errMsg}>{facErrors.mobile}</div>}
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Department</label>
                <select className="cdgi-select" style={{ ...s.formInput, ...(facErrors.department_id ? s.inputErr : {}) }}
                  value={facForm.department_id} onChange={e => setFacForm({ ...facForm, department_id: e.target.value })}>
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {facErrors.department_id && <div style={s.errMsg}>{facErrors.department_id}</div>}
              </div>

              {genCreds && (
                <div style={s.credBox}>
                  <div style={s.credTitle}>🔐 Login Credentials Generated</div>
                  <div style={s.credRow}>
                    <span style={s.credLabel}>Email</span>
                    <span style={s.credVal}>{genCreds.email}</span>
                  </div>
                  <div style={s.credRow}>
                    <span style={s.credLabel}>Password</span>
                    <span style={s.credVal}>{genCreds.password}</span>
                  </div>
                  <div style={s.credNote}>⚠ Share these credentials with the faculty. Password should be changed on first login.</div>
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button className="btn-cancel" style={s.btnCancel} onClick={() => setShowAddFac(false)}>Cancel</button>
              {credStep === 1
                ? <button className="btn-pri" style={s.btnPrimary} onClick={handleGenCreds}>Generate Credentials</button>
                : <button className="btn-pri" style={s.btnPrimary} onClick={handleAddFaculty}>Add Faculty</button>}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD ROOM MODAL ===== */}
      {showAddRoom && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>Add New Room</div>
              <button style={s.modalClose} onClick={() => setShowAddRoom(false)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.formRow}>
                <label style={s.formLabel}>Room Number / Name</label>
                <input className="cdgi-input" style={{ ...s.formInput, ...(roomErrors.name ? s.inputErr : {}) }}
                  type="text" placeholder="eg. 204 or Lab-3"
                  value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} />
                {roomErrors.name && <div style={s.errMsg}>{roomErrors.name}</div>}
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Room Type</label>
                <select className="cdgi-select" style={s.formInput}
                  value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}>
                  <option value="Classroom">Classroom</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                </select>
              </div>
              <div style={s.formGrid}>
                <div style={s.formRow}>
                  <label style={s.formLabel}>Latitude</label>
                  <input className="cdgi-input" style={{ ...s.formInput, ...(roomErrors.latitude ? s.inputErr : {}) }}
                    type="number" placeholder="eg. 22.7196" step="0.0001"
                    value={roomForm.latitude} onChange={e => setRoomForm({ ...roomForm, latitude: e.target.value })} />
                  {roomErrors.latitude && <div style={s.errMsg}>{roomErrors.latitude}</div>}
                </div>
                <div style={s.formRow}>
                  <label style={s.formLabel}>Longitude</label>
                  <input className="cdgi-input" style={{ ...s.formInput, ...(roomErrors.longitude ? s.inputErr : {}) }}
                    type="number" placeholder="eg. 75.8577" step="0.0001"
                    value={roomForm.longitude} onChange={e => setRoomForm({ ...roomForm, longitude: e.target.value })} />
                  {roomErrors.longitude && <div style={s.errMsg}>{roomErrors.longitude}</div>}
                </div>
              </div>
              <div style={s.formRow}>
                <label style={s.formLabel}>Radius (meters) — GPS verification range</label>
                <input className="cdgi-input" style={{ ...s.formInput, ...(roomErrors.radius_meters ? s.inputErr : {}) }}
                  type="number" placeholder="eg. 30" min="5" max="200"
                  value={roomForm.radius_meters} onChange={e => setRoomForm({ ...roomForm, radius_meters: e.target.value })} />
                {roomErrors.radius_meters && <div style={s.errMsg}>{roomErrors.radius_meters}</div>}
              </div>
              <div style={{ background: '#F4F6F9', borderRadius: 4, padding: '10px 12px', fontSize: 12, color: '#8A8A8A', marginTop: 4 }}>
                📍 Students must be within this radius to mark attendance via GPS.
              </div>
            </div>
            <div style={s.modalFooter}>
              <button className="btn-cancel" style={s.btnCancel} onClick={() => setShowAddRoom(false)}>Cancel</button>
              <button className="btn-pri" style={s.btnPrimary} onClick={handleAddRoom}>Add Room</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  sidebar: { width: 220, position: 'fixed', top: 0, left: 0, bottom: 0, background: '#2C3E6B', display: 'flex', flexDirection: 'column', zIndex: 100 },
  sidebarTop: { padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10 },
  sLogo: { width: 34, height: 34, borderRadius: '50%', background: '#F0C040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#2C3E6B', flexShrink: 0 },
  sBrand: { color: '#fff', fontSize: 12, fontWeight: 500, lineHeight: 1.3 },
  sBrandSub: { display: 'block', fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 400 },
  navList: { flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,.7)', cursor: 'pointer', marginBottom: 4, border: 'none', background: 'none', width: '100%', textAlign: 'left' },
  navActive: { background: 'rgba(255,255,255,.15)', color: '#fff', fontWeight: 500 },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 },
  sidebarFooter: { padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,.1)' },
  adminCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,.08)', marginBottom: 8 },
  aAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#F0C040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2C3E6B', flexShrink: 0 },
  aName: { fontSize: 12, fontWeight: 500, color: '#fff' },
  aId: { fontSize: 10, color: 'rgba(255,255,255,.5)' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 6, fontSize: 13, color: 'rgba(255,255,255,.6)', cursor: 'pointer', border: 'none', background: 'none', width: '100%' },
  main: { marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#D6DCE4', fontFamily: "'Poppins',sans-serif" },
  topbar: { background: '#fff', borderBottom: '1px solid #D0D5DF', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  pageTitle: { fontSize: 16, fontWeight: 600, color: '#1A1A1A' },
  topbarDate: { fontSize: 12, color: '#8A8A8A' },
  adminBadge: { background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  content: { padding: '24px 28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: '18px 20px' },
  statLabel: { fontSize: 11, color: '#8A8A8A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 },
  statVal: { fontSize: 28, fontWeight: 600, color: '#1A1A1A' },
  statSub: { fontSize: 11, color: '#8A8A8A', marginTop: 4 },
  card: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 14 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '.05em', padding: '9px 12px', borderBottom: '1px solid #D0D5DF', background: '#F4F6F9' },
  td: { padding: '11px 12px', fontSize: 13, borderBottom: '1px solid #D0D5DF', color: '#1A1A1A' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  deptTab: { padding: '7px 16px', borderRadius: 4, border: '1px solid #D0D5DF', background: '#fff', fontSize: 12, fontWeight: 500, color: '#4A4A4A', cursor: 'pointer' },
  deptTabActive: { background: '#2C3E6B', color: '#fff', borderColor: '#2C3E6B' },
  deptCard: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 18, cursor: 'pointer' },
  secCard: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 16, cursor: 'pointer', textAlign: 'center' },
  roomCard: { background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 16 },
  btnPrimary: { background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  btnDanger: { background: '#fff', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 4, padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  btnExport: { background: '#16A34A', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 6, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.18)' },
  modalHeader: { background: '#2C3E6B', color: '#fff', padding: '16px 20px', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 1 },
  modalTitle: { fontSize: 14, fontWeight: 600 },
  modalClose: { background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1 },
  modalBody: { padding: 20 },
  modalFooter: { padding: '14px 20px', borderTop: '1px solid #D0D5DF', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: '#fff' },
  formRow: { marginBottom: 14 },
  formLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#4A4A4A', marginBottom: 5 },
  formInput: { width: '100%', padding: '9px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontSize: 13, color: '#1A1A1A', background: '#fff' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  inputErr: { borderColor: '#DC2626' },
  errMsg: { fontSize: 11, color: '#DC2626', marginTop: 4 },
  btnCancel: { background: '#fff', border: '1px solid #D0D5DF', color: '#4A4A4A', borderRadius: 4, padding: '9px 18px', fontSize: 13, cursor: 'pointer' },
  credBox: { background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 6, padding: 16, marginTop: 16 },
  credTitle: { fontSize: 12, fontWeight: 600, color: '#2C3E6B', marginBottom: 10 },
  credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  credLabel: { fontSize: 12, color: '#8A8A8A' },
  credVal: { fontSize: 13, fontWeight: 600, color: '#2C3E6B', fontFamily: 'monospace', background: '#fff', padding: '4px 10px', borderRadius: 4, border: '1px solid #C7D2FE' },
  credNote: { fontSize: 11, color: '#8A8A8A', marginTop: 8 },
};
