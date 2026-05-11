import React from 'react';

export default function RoomsTab({ rooms, setShowAddRoom, setRoomErrors, setRoomForm, handleRemoveRoom }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
          Rooms & Labs
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '8px' }}>({rooms.length} rooms)</span>
        </div>
        <button className="btn-primary"
          onClick={() => { setShowAddRoom(true); setRoomErrors({}); setRoomForm({ name: '', type: 'Classroom', latitude: '', longitude: '', radius_meters: '' }); }}>
          + Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏫</div>
          <div style={{ fontSize: '13px' }}>No rooms added yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {rooms.map((r) => (
            <div key={r.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{r.name}</div>
                  <span style={{ background: '#EEF2FF', color: 'var(--primary)', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', marginTop: '6px', display: 'inline-block' }}>
                    {r.type || 'Classroom'}
                  </span>
                </div>
                <button
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: '500' }}
                  onClick={() => handleRemoveRoom(r.id, r.name)}
                >
                  Remove
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                📍 Lat: {r.latitude}, Long: {r.longitude}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                🎯 GPS Radius: <strong style={{ color: 'var(--text-main)' }}>{r.radius_meters}m</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
