import React from 'react';

export default function StudentsTab({ 
  students, departments, stuAttendance, stuFilter, setStudentFilter 
}) {
  const filteredStudents = students.filter(st => {
    if (stuFilter.dept && st.department_id !== stuFilter.dept) return false;
    if (stuFilter.sem && st.semester !== parseInt(stuFilter.sem)) return false;
    if (stuFilter.section) {
      const sec = (st.section || '').toUpperCase();
      if (!sec.endsWith(stuFilter.section.toUpperCase())) return false;
    }
    return true;
  });

  const getStuStatus = (pct) => {
    if (pct === null || pct === undefined) return { label: '—', color: 'var(--text-muted)', bg: 'transparent' };
    if (pct >= 75) return { label: 'Safe', color: 'var(--success)', bg: '#D1FAE5' };
    if (pct >= 65) return { label: 'Warning', color: 'var(--warning)', bg: '#FEF3C7' };
    return { label: 'Critical', color: 'var(--error)', bg: '#FEE2E2' };
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

  return (
    <div className="fade-in">
      {/* Filter Row */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Department */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Department</label>
            <select className="form-input"
              value={stuFilter.dept}
              onChange={e => setStudentFilter({ dept: e.target.value, year: '', sem: '', section: '' })}>
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Year</label>
            <select className="form-input"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Semester</label>
            <select className="form-input"
              value={stuFilter.sem}
              onChange={e => setStudentFilter(prev => ({ ...prev, sem: e.target.value, section: '' }))}
              disabled={!stuFilter.year}>
              <option value="">All Semesters</option>
              {stuFilter.year === '1' && <><option value="1">Semester 1</option><option value="2">Semester 2</option></>}
              {stuFilter.year === '2' && <><option value="3">Semester 3</option><option value="4">Semester 4</option></>}
              {stuFilter.year === '3' && <><option value="5">Semester 5</option><option value="6">Semester 6</option></>}
              {stuFilter.year === '4' && <><option value="7">Semester 7</option><option value="8">Semester 8</option></>}
            </select>
          </div>

          {/* Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>Section</label>
            <select className="form-input"
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
            <button className="btn-primary" style={{ background: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
              onClick={() => setStudentFilter({ dept: '', year: '', sem: '', section: '' })}>
              ✕ Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
            Student List
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '10px' }}>
              ({filteredStudents.length} students)
            </span>
          </div>
          <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={exportStudentsCSV}>
            ⬇ Export CSV
          </button>
        </div>

        {filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>👥</div>
            <div style={{ fontSize: '15px' }}>
              {stuFilter.dept ? 'No students found for selected filters' : 'Select a department to view students'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border)' }}>
                  {['Sr.', 'Enrollment No.', 'Name', 'Department', 'Sem', 'Sec', 'Status', 'Attendance'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st, idx) => {
                  const pct = stuAttendance[st.id];
                  const status = getStuStatus(pct);
                  const dept = departments.find(d => d.id === st.department_id);
                  return (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-main)' }}>{st.enrollment_no}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-main)', fontSize: '14px' }}>{st.users?.name || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#EEF2FF', color: 'var(--primary)', fontSize: '12px', fontWeight: '500', padding: '4px 10px', borderRadius: '20px' }}>
                          {dept?.code || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)' }}>Sem {st.semester}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-main)' }}>{st.section || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: st.status === 'approved' ? '#D1FAE5' : st.status === 'rejected' ? '#FEE2E2' : '#FEF3C7', color: st.status === 'approved' ? 'var(--success)' : st.status === 'rejected' ? 'var(--error)' : 'var(--warning)', fontSize: '12px', fontWeight: '500', padding: '4px 10px', borderRadius: '20px' }}>
                          {st.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {pct !== null && pct !== undefined ? (
                          <span style={{ background: status.bg, color: status.color, fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                            {pct}%
                          </span>
                        ) : <span style={{ color: 'var(--border)', fontSize: '13px' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
