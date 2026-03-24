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
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [facDept, setFacDept] = useState('ALL');
  const [showAddFac, setShowAddFac] = useState(false);
  const [facForm, setFacForm] = useState({ name: '', email: '', mobile: '', department_id: '', designation: 'Assistant Professor' });
  const [facErrors, setFacErrors] = useState({});
  const [genCreds, setGenCreds] = useState(null);
  const [credStep, setCredStep] = useState(1);

  const [students, setStudents] = useState([]);
  const [stuAttendance, setStuAttendance] = useState({});
  const [stuFilter, setStudentFilter] = useState({ dept: '', year: '', sem: '', section: '' });

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
    fetchPendingRequests();
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
      // Fallback 
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
      // Attendance fetch
      if (res.data.length > 0) {
        const map = {};
        await Promise.all(res.data.map(async (st) => {
          try {
            const r = await api.get('/attendance/student/' + st.id);
            const total = r.data.length;
            const present = r.data.filter(a => a.status === 'present').length;
            map[st.id] = total > 0 ? Math.round((present / total) * 100) : null;
          } catch { map[st.id] = null; }
        }));
        setStuAttendance(map);
      }
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
        const res = await api.get('/attendance/student/' + st.id);
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
      // Unique employee_id — timestamp based
      const empId = `FAC-${Date.now().toString().slice(-6)}`;
      
      const res = await api.post('/auth/register', {
        name: facForm.name,
        email: facForm.email,
        password: genCreds.password,
        role: 'teacher',
        employee_id: empId,
        department_id: facForm.department_id,
        designation: facForm.designation || 'Assistant Professor',
      });

      if (res.data) {
        toast.success(`${facForm.name} added successfully!`);
        setShowAddFac(false);
        setFacForm({ name: '', email: '', mobile: '', department_id: '', designation: 'Assistant Professor' });
        setGenCreds(null);
        setCredStep(1);
        fetchTeachers();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Could not add faculty';
      toast.error(errMsg);
      console.error('Add faculty error:', errMsg);
    }
  };

  // ---- ROOM VALIDATION ----
  const validateRoomForm = () => {
    const errs = {};
    if (!roomForm.name.trim()) errs.name = 'Room name required';
    
    if (!roomForm.latitude) errs.latitude = 'Latitude required (eg. 22.7196)';
    else if (isNaN(roomForm.latitude)) errs.latitude = 'Invalid — only numbers allowed (eg. 22.7196)';
    else if (parseFloat(roomForm.latitude) < -90 || parseFloat(roomForm.latitude) > 90) errs.latitude = 'Latitude must be between -90 and 90';
    
    if (!roomForm.longitude) errs.longitude = 'Longitude required (eg. 75.8577)';
    else if (isNaN(roomForm.longitude)) errs.longitude = 'Invalid — only numbers allowed (eg. 75.8577)';
    else if (parseFloat(roomForm.longitude) < -180 || parseFloat(roomForm.longitude) > 180) errs.longitude = 'Longitude must be between -180 and 180';
    
    if (!roomForm.radius_meters) errs.radius_meters = 'GPS radius required (eg. 30)';
    else if (isNaN(roomForm.radius_meters)) errs.radius_meters = 'Invalid — only numbers allowed (eg. 30)';
    else if (parseInt(roomForm.radius_meters) < 5) errs.radius_meters = 'Minimum radius is 5 meters';
    else if (parseInt(roomForm.radius_meters) > 500) errs.radius_meters = 'Maximum radius is 500 meters';
    
    setRoomErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  const handleRemoveRoom = async (roomId, name) => {
    if (!window.confirm('Remove room "' + name + '"? This cannot be undone.')) return;
    try {
      await api.delete('/sessions/rooms/' + roomId);
      toast.success(name + ' removed successfully');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not remove room');
    }
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

  const fetchPendingRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/students/pending-requests');
      setPendingRequests(res.data);
    } catch { console.error('pending requests fetch failed'); }
    finally { setRequestsLoading(false); }
  };

  const handleApprove = async (studentId, name) => {
    if (!window.confirm(`Approve ${name}?`)) return;
    try {
      await api.patch(`/students/approve/${studentId}`);
      toast.success(`${name} approved successfully!`);
      fetchPendingRequests();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not approve');
    }
  };

  const handleReject = async (studentId, name) => {
    if (!window.confirm(`Reject ${name}? This will deny their access.`)) return;
    try {
      await api.patch(`/students/reject/${studentId}`);
      toast.success(`${name} rejected.`);
      fetchPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not reject');
    }
  };

  // Students filter logic
  const filteredStudents = students.filter(st => {
    if (stuFilter.dept && st.department_id !== stuFilter.dept) return false;
    if (stuFilter.sem && st.semester !== parseInt(stuFilter.sem)) return false;
    if (stuFilter.section) {
      const lastChar = (st.enrollment_no || '').slice(-1).toUpperCase();
      if (lastChar !== stuFilter.section) return false;
    }
    return true;
  });

  const getStuStatus = (pct) => {
    if (pct === null || pct === undefined) return { label: '—', color: '#8A8A8A', bg: 'transparent' };
    if (pct >= 75) return { label: 'Safe', color: '#16A34A', bg: '#DCFCE7' };
    if (pct >= 65) return { label: 'Warning', color: '#D97706', bg: '#FEF3C7' };
    return { label: 'Critical', color: '#DC2626', bg: '#FEF2F2' };
  };

  const exportStudentsCSV = () => {
    const csv = [
      ['Sr.', 'Enrollment No.', 'Name', 'Department', 'Semester', 'Attendance %', 'Status'].join(','),
      ...filteredStudents.map((st, i) => {
        const dept = departments.find(d => d.id === st.department_id);
        const pct = stuAttendance[st.id];
        return [
          i + 1,
          st.enrollment_no,
          st.users?.name || '',
          dept?.code || '',
          'Sem ' + st.semester,
          pct !== null && pct !== undefined ? pct + '%' : '—',
          st.status || 'pending',
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveFaculty = async (teacherId, name) => {
    if (!window.confirm(`Remove ${name || 'this faculty'}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/students/teacher/${teacherId}`);
      toast.success(`${name || 'Faculty'} removed successfully`);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not remove faculty');
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
    { key: 'requests', label: 'Requests', icon: '📋' },
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
                <span style={s.navIcon}>{tab.icon}</span>
                {tab.label}
                {tab.key === 'requests' && pendingRequests.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                    {pendingRequests.length}
                  </span>
                )}
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
                  <button className="dept-tab-btn" onClick={() => setFacDept('ALL')}
                    style={{ ...s.deptTab, ...(facDept === 'ALL' ? s.deptTabActive : {}) }}>All</button>
                  {departments.map(d => (
                    <button key={d.id} className="dept-tab-btn" onClick={() => setFacDept(d.id)}
                      style={{ ...s.deptTab, ...(facDept === d.id ? s.deptTabActive : {}) }}>
                      {d.code}
                    </button>
                  ))}
                </div>
                <div style={s.card}>
                  <div style={s.sectionHeader}>
                    <div style={{ ...s.sectionTitle, marginBottom: 0 }}>
                      Faculty List
                      <span style={{ fontSize: 12, color: '#8A8A8A', fontWeight: 400, marginLeft: 8 }}>
                        ({(facDept === 'ALL' ? teachers : teachers.filter(t => t.department_id === facDept)).length} faculty)
                      </span>
                    </div>
                    <button className="btn-pri" style={s.btnPrimary}
                      onClick={() => { setShowAddFac(true); setCredStep(1); setGenCreds(null); setFacForm({ name: '', email: '', mobile: '', department_id: '', designation: 'Assistant Professor' }); setFacErrors({}); }}>
                      + Add Faculty
                    </button>
                  </div>
                  <table style={s.table}>
                    <thead>
                      <tr style={{ background: '#F4F6F9' }}>
                        {['Employee ID', 'Name', 'Designation', 'Department', 'Email', 'Action'].map(h => <th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(facDept === 'ALL' ? teachers : teachers.filter(t => t.department_id === facDept)).map(t => (
                        <tr key={t.id} className="cdgi-tr">
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{t.employee_id || '—'}</td>
                          <td style={{ ...s.td, fontWeight: 500 }}>{t.users?.name || '—'}</td>
                          <td style={s.td}>
                            <span style={{ ...s.badge, background: '#EEF2FF', color: '#2C3E6B', fontSize: 11 }}>
                              {t.designation || 'Assistant Professor'}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ ...s.badge, background: '#F0FDF4', color: '#16A34A', fontSize: 11 }}>
                              {departments.find(d => d.id === t.department_id)?.code || '—'}
                            </span>
                          </td>
                          <td style={s.td}>{t.users?.email || '—'}</td>
                          <td style={s.td}>
                            <button className="btn-dng" style={s.btnDanger}
                              onClick={() => handleRemoveFaculty(t.id, t.users?.name)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                      {(facDept === 'ALL' ? teachers : teachers.filter(t => t.department_id === facDept)).length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#8A8A8A', fontSize: 13 }}>No faculties found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== STUDENTS ===== */}
            {activeTab === 'students' && (
              <div>
                {/* Filter Row */}
                <div style={{ background: '#fff', border: '1px solid #D0D5DF', borderRadius: 6, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

                    {/* Department */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                      <label style={s.formLabel}>Department</label>
                      <select className="cdgi-select" style={s.formInput}
                        value={stuFilter.dept}
                        onChange={e => setStudentFilter({ dept: e.target.value, year: '', sem: '', section: '' })}>
                        <option value="">All Departments</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Year */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                      <label style={s.formLabel}>Year</label>
                      <select className="cdgi-select" style={s.formInput}
                        value={stuFilter.year}
                        onChange={e => setStudentFilter(prev => ({ ...prev, year: e.target.value, sem: '', section: '' }))}
                        disabled={!stuFilter.dept}>
                        <option value="">All Years</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>

                    {/* Semester */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
                      <label style={s.formLabel}>Semester</label>
                      <select className="cdgi-select" style={s.formInput}
                        value={stuFilter.sem}
                        onChange={e => setStudentFilter(prev => ({ ...prev, sem: e.target.value, section: '' }))}
                        disabled={!stuFilter.year}>
                        <option value="">All Semesters</option>
                        {stuFilter.year === '1' && <>
                          <option value="1">Semester 1</option>
                          <option value="2">Semester 2</option>
                        </>}
                        {stuFilter.year === '2' && <>
                          <option value="3">Semester 3</option>
                          <option value="4">Semester 4</option>
                        </>}
                        {stuFilter.year === '3' && <>
                          <option value="5">Semester 5</option>
                          <option value="6">Semester 6</option>
                        </>}
                        {stuFilter.year === '4' && <>
                          <option value="7">Semester 7</option>
                          <option value="8">Semester 8</option>
                        </>}
                      </select>
                    </div>

                    {/* Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
                      <label style={s.formLabel}>Section</label>
                      <select className="cdgi-select" style={s.formInput}
                        value={stuFilter.section}
                        onChange={e => setStudentFilter(prev => ({ ...prev, section: e.target.value }))}
                        disabled={!stuFilter.sem}>
                        <option value="">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                      </select>
                    </div>

                    {/* Reset */}
                    {(stuFilter.dept || stuFilter.year || stuFilter.sem || stuFilter.section) && (
                      <button style={{ padding: '8px 14px', background: '#F4F6F9', border: '1px solid #D0D5DF', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: '#4A4A4A', alignSelf: 'flex-end' }}
                        onClick={() => setStudentFilter({ dept: '', year: '', sem: '', section: '' })}>
                        ✕ Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Students Table */}
                <div style={s.card}>
                  <div style={s.sectionHeader}>
                    <div style={{ ...s.sectionTitle, marginBottom: 0 }}>
                      Student List
                      <span style={{ fontSize: 12, color: '#8A8A8A', fontWeight: 400, marginLeft: 8 }}>
                        ({filteredStudents.length} students)
                      </span>
                    </div>
                    <button className="btn-exp" style={s.btnExport} onClick={exportStudentsCSV}>
                      ⬇ Export CSV
                    </button>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 24px', color: '#8A8A8A' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
                      <div style={{ fontSize: 13 }}>
                        {stuFilter.dept ? 'No students found for selected filters' : 'Select a department to view students'}
                      </div>
                    </div>
                  ) : (
                    <table style={s.table}>
                      <thead>
                        <tr style={{ background: '#F4F6F9' }}>
                          {['Sr.', 'Enrollment No.', 'Name', 'Department', 'Semester', 'Section', 'Status', 'Attendance'].map(h => (
                            <th key={h} style={s.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((st, idx) => {
                          const pct = stuAttendance[st.id];
                          const status = getStuStatus(pct);
                          const dept = departments.find(d => d.id === st.department_id);
                          const secLetter = st.enrollment_no?.slice(-1) || '—';
                          return (
                            <tr key={st.id} className="cdgi-tr">
                              <td style={{ ...s.td, color: '#8A8A8A', fontSize: 12 }}>{idx + 1}</td>
                              <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{st.enrollment_no}</td>
                              <td style={{ ...s.td, fontWeight: 500 }}>{st.users?.name || '—'}</td>
                              <td style={s.td}>
                                <span style={{ ...s.badge, background: '#EEF2FF', color: '#2C3E6B', fontSize: 11 }}>
                                  {dept?.code || '—'}
                                </span>
                              </td>
                              <td style={s.td}>Sem {st.semester}</td>
                              <td style={s.td}>{secLetter}</td>
                              <td style={s.td}>
                                <span style={{ ...s.badge, background: st.status === 'approved' ? '#DCFCE7' : st.status === 'rejected' ? '#FEF2F2' : '#FEF3C7', color: st.status === 'approved' ? '#16A34A' : st.status === 'rejected' ? '#DC2626' : '#D97706', fontSize: 11 }}>
                                  {st.status || 'pending'}
                                </span>
                              </td>
                              <td style={s.td}>
                                {pct !== null && pct !== undefined ? (
                                  <span style={{ ...s.badge, background: status.bg, color: status.color, fontSize: 11 }}>
                                    {pct}%
                                  </span>
                                ) : <span style={{ color: '#C0C4CC', fontSize: 12 }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ===== ROOMS ===== */}
            {activeTab === 'rooms' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                    Rooms & Labs
                    <span style={{ fontSize: 12, color: '#8A8A8A', fontWeight: 400, marginLeft: 8 }}>({rooms.length} rooms)</span>
                  </div>
                  <button className="btn-pri" style={s.btnPrimary}
                    onClick={() => { setShowAddRoom(true); setRoomErrors({}); setRoomForm({ name: '', type: 'Classroom', latitude: '', longitude: '', radius_meters: '' }); }}>
                    + Add Room
                  </button>
                </div>

                {rooms.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#8A8A8A' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🏫</div>
                    <div style={{ fontSize: 13 }}>No rooms added yet</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {rooms.map((r) => (
                      <div key={r.id} style={s.roomCard}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#2C3E6B' }}>{r.name}</div>
                            <span style={{ ...s.badge, background: '#EEF2FF', color: '#2C3E6B', fontSize: 11, marginTop: 4, display: 'inline-block' }}>
                              {r.type || 'Classroom'}
                            </span>
                          </div>
                          <button className="btn-dng" style={{ ...s.btnDanger, fontSize: 11, padding: '4px 10px' }}
                            onClick={() => handleRemoveRoom(r.id, r.name)}>
                            Remove
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 4 }}>
                          📍 Lat: {r.latitude}, Long: {r.longitude}
                        </div>
                        <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 4 }}>
                          🎯 GPS Radius: <strong style={{ color: '#2C3E6B' }}>{r.radius_meters}m</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== REQUESTS ===== */}
            {activeTab === 'requests' && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 16 }}>
                  Pending Student Requests
                  {pendingRequests.length > 0 && (
                    <span style={{ marginLeft: 8, background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                      {pendingRequests.length}
                    </span>
                  )}
                </div>

                {requestsLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#8A8A8A', fontSize: 13 }}>Loading...</div>
                ) : pendingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#8A8A8A' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>No pending requests</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>All student registrations are reviewed</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {pendingRequests.map(req => (
                      <div key={req.id} style={{ background: '#fff', border: '1px solid #D0D5DF', borderRadius: 8, overflow: 'hidden' }}>
                        {/* Face Image */}
                        <div style={{ background: '#2C3E6B', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          {req.face_image ? (
                            <img
                              src={`data:image/jpeg;base64,${req.face_image}`}
                              alt='face'
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ fontSize: 48, opacity: 0.4 }}>👤</div>
                          )}
                          <div style={{ position: 'absolute', top: 8, right: 8, background: '#FEF3C7', color: '#D97706', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                            PENDING
                          </div>
                        </div>

                        {/* Info */}
                        <div style={{ padding: 14 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>
                            {req.users?.name || '—'}
                          </div>
                          <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 2 }}>{req.users?.email || '—'}</div>
                          <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 2 }}>
                            Enrollment: <span style={{ color: '#1A1A1A', fontFamily: 'monospace' }}>{req.enrollment_no}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 12 }}>Semester: {req.semester}</div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleApprove(req.id, req.users?.name)}
                              style={{ flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id, req.users?.name)}
                              style={{ flex: 1, background: '#fff', color: '#DC2626', border: '1.5px solid #DC2626', borderRadius: 6, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
                {facErrors.department_id && <div style={s.errMsg}>{facErrors.department_id}</div>}
              </div>

              <div style={s.formRow}>
                <label style={s.formLabel}>Designation</label>
                <select className="cdgi-select" style={s.formInput}
                  value={facForm.designation} onChange={e => setFacForm({ ...facForm, designation: e.target.value })}>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Head of Department">Head of Department</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
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
                  type="text" placeholder="eg. Room 204, Lab-3, Seminar Hall"
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

              <div style={{ background: '#EEF2FF', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#2C3E6B', marginBottom: 14 }}>
                💡 <strong>GPS Coordinates kaise nikale?</strong> Google Maps kholo, room ki building par right-click karo → "What's here?" → coordinates copy karo
              </div>

              <div style={s.formGrid}>
                <div style={s.formRow}>
                  <label style={s.formLabel}>Latitude <span style={{ color: '#8A8A8A', fontWeight: 400 }}>(numbers only)</span></label>
                  <input className="cdgi-input" style={{ ...s.formInput, ...(roomErrors.latitude ? s.inputErr : {}) }}
                    type="text" placeholder="eg. 22.7196"
                    value={roomForm.latitude}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || v === '-' || /^-?[0-9]*\.?[0-9]*$/.test(v)) {
                        setRoomForm({ ...roomForm, latitude: v });
                      }
                    }} />
                  {roomErrors.latitude && <div style={s.errMsg}>{roomErrors.latitude}</div>}
                </div>
                <div style={s.formRow}>
                  <label style={s.formLabel}>Longitude <span style={{ color: '#8A8A8A', fontWeight: 400 }}>(numbers only)</span></label>
                  <input className="cdgi-input" style={{ ...s.formInput, ...(roomErrors.longitude ? s.inputErr : {}) }}
                    type="text" placeholder="eg. 75.8577"
                    value={roomForm.longitude}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || v === '-' || /^-?[0-9]*\.?[0-9]*$/.test(v)) {
                        setRoomForm({ ...roomForm, longitude: v });
                      }
                    }} />
                  {roomErrors.longitude && <div style={s.errMsg}>{roomErrors.longitude}</div>}
                </div>
              </div>

              <div style={s.formRow}>
                <label style={s.formLabel}>
                  GPS Radius (meters)
                  <span style={{ color: '#8A8A8A', fontWeight: 400 }}> — students must be within this distance</span>
                </label>
                <input className="cdgi-input" style={{ ...s.formInput, ...(roomErrors.radius_meters ? s.inputErr : {}) }}
                  type="text" placeholder="eg. 30 (recommended: 30–100 meters)"
                  value={roomForm.radius_meters}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    setRoomForm({ ...roomForm, radius_meters: v });
                  }} />
                {roomErrors.radius_meters
                  ? <div style={s.errMsg}>{roomErrors.radius_meters}</div>
                  : <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 4 }}>
                      Recommended: 30–60m for classrooms, 50–100m for large halls
                    </div>
                }
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
