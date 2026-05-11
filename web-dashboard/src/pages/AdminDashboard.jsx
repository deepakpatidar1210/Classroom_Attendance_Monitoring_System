import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import TimetableManager from '../components/TimetableManager';
import NotificationBell from '../components/NotificationBell';

import DashboardTab from '../components/admin/DashboardTab';
import FacultyTab from '../components/admin/FacultyTab';
import StudentsTab from '../components/admin/StudentsTab';
import RoomsTab from '../components/admin/RoomsTab';
import RequestsTab from '../components/admin/RequestsTab';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ teachers: 0, students: 0, rooms: 0, avg: 0 });
  const [departments, setDepartments] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
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
    fetchRecentActivity();
  }, []);

  useEffect(() => {
    let totalPct = 0; let count = 0;
    Object.values(stuAttendance).forEach(pct => {
      if (pct !== null && pct !== undefined) { totalPct += pct; count++; }
    });
    setStats(prev => ({ ...prev, avg: count > 0 ? Math.round(totalPct / count) : 0 }));
  }, [stuAttendance]);

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
      setDepartments([
        { id: 'fd1e3235-48d4-4b08-bfd4-4af05a53ff91', name: 'Computer Science (CSE)', code: 'CS' },
      ]);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const res = await api.get('/sessions/all');
      setRecentActivity(res.data);
    } catch { console.error('recent activity fetch failed'); }
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
      if (res.data.length > 0) {
        const map = {};
        await Promise.all(res.data.map(async (st) => {
          try {
            const r = await api.get('/attendance/stats/' + st.id);
            map[st.id] = r.data.total > 0 ? Math.round((r.data.present / r.data.total) * 100) : null;
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
    if (!window.confirm(`Remove room "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/sessions/rooms/${roomId}`);
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

  const navTabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { key: 'faculties', label: 'Faculties', icon: '👨‍🏫' },
    { key: 'students', label: 'Students', icon: '👥' },
    { key: 'rooms', label: 'Rooms', icon: '🚪' },
    { key: 'requests', label: 'Requests', icon: '📋' },
    { key: 'timetable', label: 'Timetable', icon: '📅' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '240px', background: 'var(--sidebar-bg)', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px' }}>A</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px' }}>AttendSoft</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Admin Panel</div>
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navTabs.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none',
                background: activeTab === tab.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'white', fontSize: '14px', fontWeight: activeTab === tab.key ? '600' : '400',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s'
              }}>
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
              {tab.key === 'requests' && pendingRequests.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--error)', color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '10px' }}>
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px' }}>
              {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Administrator'}</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>System Admin</div>
            </div>
          </div>
          <button style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <span>⎋</span> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', overflow: 'hidden' }}>
        <div style={{ background: 'var(--topbar-gradient)', padding: '32px 32px 48px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: activeTab === 'dashboard' ? '24px' : '0' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px' }}>
                {activeTab === 'dashboard' 
                  ? `Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, ${user?.name?.split(' ')[0] || 'Admin'}!`
                  : navTabs.find(t => t.key === activeTab)?.label}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.9 }}>
                <span>📅 {today}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <NotificationBell userRole="admin" />
              <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛡️</span> Admin
              </div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Total Faculties</div>
                <div style={{ fontSize: '28px', fontWeight: '700', margin: '4px 0' }}>{stats.teachers}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Total Students</div>
                <div style={{ fontSize: '28px', fontWeight: '700', margin: '4px 0' }}>{stats.students}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Total Rooms</div>
                <div style={{ fontSize: '28px', fontWeight: '700', margin: '4px 0' }}>{stats.rooms}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Avg Attendance</div>
                <div style={{ fontSize: '28px', fontWeight: '700', margin: '4px 0', color: stats.avg >= 75 ? '#DCFCE7' : stats.avg >= 60 ? '#FEF08A' : '#FECACA' }}>
                  {stats.avg}%
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="page-container" style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px', marginTop: '-24px' }}>
          {activeTab === 'dashboard' && <DashboardTab departments={departments} students={students} stuAttendance={stuAttendance} recentActivity={recentActivity} />}
          {activeTab === 'faculties' && <FacultyTab teachers={teachers} departments={departments} facDept={facDept} setFacDept={setFacDept} setShowAddFac={setShowAddFac} setCredStep={setCredStep} setGenCreds={setGenCreds} setFacForm={setFacForm} setFacErrors={setFacErrors} handleRemoveFaculty={handleRemoveFaculty} />}
          {activeTab === 'students' && <StudentsTab students={students} departments={departments} stuAttendance={stuAttendance} stuFilter={stuFilter} setStudentFilter={setStudentFilter} />}
          {activeTab === 'rooms' && <RoomsTab rooms={rooms} setShowAddRoom={setShowAddRoom} setRoomErrors={setRoomErrors} setRoomForm={setRoomForm} handleRemoveRoom={handleRemoveRoom} />}
          {activeTab === 'requests' && <RequestsTab pendingRequests={pendingRequests} requestsLoading={requestsLoading} handleApprove={handleApprove} handleReject={handleReject} />}
          {activeTab === 'timetable' && <TimetableManager />}
        </div>
      </main>

      {/* Modals for Adding Faculty/Rooms */}
      {showAddFac && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card fade-in" style={{ width: '480px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '600' }}>Add New Faculty</div>
              <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowAddFac(false)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              {credStep === 1 ? (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Full Name</label>
                    <input className={`form-input ${facErrors.name ? 'error' : ''}`} value={facForm.name} onChange={e => setFacForm({...facForm, name: e.target.value})} placeholder="e.g. Dr. John Doe" />
                    {facErrors.name && <span className="error-text">{facErrors.name}</span>}
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Email</label>
                    <input type="email" className={`form-input ${facErrors.email ? 'error' : ''}`} value={facForm.email} onChange={e => setFacForm({...facForm, email: e.target.value})} placeholder="faculty@cdgi.ac.in" />
                    {facErrors.email && <span className="error-text">{facErrors.email}</span>}
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Mobile No.</label>
                    <input className={`form-input ${facErrors.mobile ? 'error' : ''}`} value={facForm.mobile} onChange={e => setFacForm({...facForm, mobile: e.target.value})} placeholder="10 digit number" />
                    {facErrors.mobile && <span className="error-text">{facErrors.mobile}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Department</label>
                      <select className={`form-input ${facErrors.department_id ? 'error' : ''}`} value={facForm.department_id} onChange={e => setFacForm({...facForm, department_id: e.target.value})}>
                        <option value="">Select Dept...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                      </select>
                      {facErrors.department_id && <span className="error-text">{facErrors.department_id}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Designation</label>
                      <input className="form-input" value={facForm.designation} onChange={e => setFacForm({...facForm, designation: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => setShowAddFac(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleGenCreds}>Generate Credentials ➔</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)', marginBottom: '12px' }}>Credentials Generated!</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email:</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)', fontFamily: 'monospace' }}>{genCreds.email}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Password:</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)', fontFamily: 'monospace', background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>{genCreds.password}</strong>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' }}>Please copy this password securely. It will not be shown again.</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => setCredStep(1)}>Back</button>
                    <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={handleAddFaculty}>Confirm & Save</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card fade-in" style={{ width: '400px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '600' }}>Add New Room/Lab</div>
              <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowAddRoom(false)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Room Name</label>
                <input className={`form-input ${roomErrors.name ? 'error' : ''}`} value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} placeholder="e.g. CR-101 or IT Lab-2" />
                {roomErrors.name && <span className="error-text">{roomErrors.name}</span>}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Room Type</label>
                <select className="form-input" value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})}>
                  <option value="Classroom">Classroom</option>
                  <option value="Lab">Lab</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Latitude</label>
                  <input className={`form-input ${roomErrors.latitude ? 'error' : ''}`} value={roomForm.latitude} onChange={e => setRoomForm({...roomForm, latitude: e.target.value})} placeholder="22.7196" />
                  {roomErrors.latitude && <span className="error-text">{roomErrors.latitude}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>Longitude</label>
                  <input className={`form-input ${roomErrors.longitude ? 'error' : ''}`} value={roomForm.longitude} onChange={e => setRoomForm({...roomForm, longitude: e.target.value})} placeholder="75.8577" />
                  {roomErrors.longitude && <span className="error-text">{roomErrors.longitude}</span>}
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-muted)' }}>GPS Radius Tolerance (meters)</label>
                <input className={`form-input ${roomErrors.radius_meters ? 'error' : ''}`} value={roomForm.radius_meters} onChange={e => setRoomForm({...roomForm, radius_meters: e.target.value})} placeholder="60" />
                {roomErrors.radius_meters && <span className="error-text">{roomErrors.radius_meters}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }} onClick={() => setShowAddRoom(false)}>Cancel</button>
                <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={handleAddRoom}>Save Room</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
