import React from 'react';

export default function RequestsTab({ pendingRequests, requestsLoading, handleApprove, handleReject }) {
  return (
    <div className="fade-in">
      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>
        Pending Student Requests
        {pendingRequests.length > 0 && (
          <span style={{ marginLeft: '8px', background: 'var(--error)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
            {pendingRequests.length}
          </span>
        )}
      </div>

      {requestsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading requests...</div>
      ) : pendingRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-main)' }}>No pending requests</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>All student registrations are reviewed</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {pendingRequests.map(req => (
            <div key={req.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Face Image */}
              <div style={{ background: 'var(--primary)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {req.face_image ? (
                  <img
                    src={`data:image/jpeg;base64,${req.face_image}`}
                    alt="face"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ fontSize: '48px', opacity: 0.4 }}>👤</div>
                )}
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--warning)', color: 'white', fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                  PENDING
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {req.users?.name || '—'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{req.users?.email || '—'}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Enrollment: <span style={{ color: 'var(--text-main)', fontFamily: 'monospace', fontWeight: '500' }}>{req.enrollment_no}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Semester: <strong style={{ color: 'var(--text-main)' }}>{req.semester}</strong></div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" style={{ flex: 1, padding: '10px', background: 'var(--success)' }}
                    onClick={() => handleApprove(req.id, req.users?.name)}>
                    Approve
                  </button>
                  <button className="btn-primary" style={{ flex: 1, padding: '10px', background: 'var(--surface)', color: 'var(--error)', border: '1px solid var(--error)' }}
                    onClick={() => handleReject(req.id, req.users?.name)}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
