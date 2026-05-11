import React from 'react';

export default function FacultyTab({ 
  teachers, departments, facDept, setFacDept, setShowAddFac, 
  setCredStep, setGenCreds, setFacForm, setFacErrors, handleRemoveFaculty 
}) {
  const filteredTeachers = facDept === 'ALL' ? teachers : teachers.filter(t => t.department_id === facDept);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button 
          className="btn-primary" 
          onClick={() => setFacDept('ALL')}
          style={{ background: facDept === 'ALL' ? 'var(--primary)' : 'var(--surface)', color: facDept === 'ALL' ? 'white' : 'var(--text-main)', border: '1px solid var(--border)' }}
        >
          All
        </button>
        {departments.map(d => (
          <button 
            key={d.id} 
            className="btn-primary" 
            onClick={() => setFacDept(d.id)}
            style={{ background: facDept === d.id ? 'var(--primary)' : 'var(--surface)', color: facDept === d.id ? 'white' : 'var(--text-main)', border: '1px solid var(--border)' }}
          >
            {d.code}
          </button>
        ))}
      </div>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
            Faculty List
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '10px' }}>
              ({filteredTeachers.length} faculty)
            </span>
          </div>
          <button className="btn-primary"
            onClick={() => { setShowAddFac(true); setCredStep(1); setGenCreds(null); setFacForm({ name: '', email: '', mobile: '', department_id: '', designation: 'Assistant Professor' }); setFacErrors({}); }}>
            + Add Faculty
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border)' }}>
                {['Employee ID', 'Name', 'Designation', 'Department', 'Email', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)' }}>{t.employee_id || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-main)', fontSize: '14px' }}>{t.users?.name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#EEF2FF', color: 'var(--primary)', fontSize: '12px', fontWeight: '500', padding: '4px 10px', borderRadius: '20px' }}>
                      {t.designation || 'Assistant Professor'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#F0FDF4', color: 'var(--success)', fontSize: '12px', fontWeight: '500', padding: '4px 10px', borderRadius: '20px' }}>
                      {departments.find(d => d.id === t.department_id)?.code || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{t.users?.email || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px' }}
                      onClick={() => handleRemoveFaculty(t.id, t.users?.name)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>No faculties found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
