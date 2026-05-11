import React from 'react';

export default function DashboardTab({ departments, students, stuAttendance, recentActivity }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Department-wise Attendance</div>
          {departments.map(d => {
            const deptStudents = students.filter(st => st.department_id === d.id);
            let totalPct = 0; let count = 0;
            deptStudents.forEach(st => {
              const pct = stuAttendance[st.id];
              if (pct !== null && pct !== undefined) { totalPct += pct; count++; }
            });
            const pct = count > 0 ? Math.round(totalPct / count) : 0;
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', width: '60px', flexShrink: 0 }}>{d.code}</div>
                <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: deptStudents.length === 0 ? 'var(--border)' : 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: '500', width: '36px', textAlign: 'right' }}>
                  {deptStudents.length === 0 ? '—' : `${pct}%`}
                </div>
              </div>
            );
          })}
          {departments.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No departments data</div>}
        </div>
        <div className="card">
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Recent Class Activity</div>
          {recentActivity.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.is_active ? 'var(--success)' : 'var(--warning)', marginTop: '6px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  <span style={{fontWeight: 600}}>{a.users?.name || 'Class'}</span> started session for <strong>{a.subjects?.name || 'Subject'}</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {new Date(a.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 0' }}>No recent activity.</div>}
        </div>
      </div>
    </div>
  );
}
