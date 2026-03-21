import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SECTIONS_MAP = {
  CS: ['CS I A','CS I B','CS II A','CS II B','CS III A','CS III B','CS IV A','CS IV B',
       'CS V A','CS V B','CS VI A','CS VI B','CS VII A','CS VII B','CS VIII A','CS VIII B'],
  IT: ['IT I A','IT I B','IT II A','IT II B','IT III A','IT III B','IT IV A','IT IV B'],
  EC: ['EC I A','EC I B','EC II A','EC II B','EC III A','EC III B','EC IV A','EC IV B'],
  ME: ['ME I A','ME I B','ME II A','ME II B','ME III A','ME III B','ME IV A','ME IV B'],
};
const ALL_SECTIONS = Object.values(SECTIONS_MAP).flat();

export default function TimetableManager() {
  const [periods, setPeriods] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [timetable, setTimetable] = useState([]); // array of timetable entries for selected section+day

  const [editSlot, setEditSlot] = useState(null); // { period_no, ... }
  const [editForm, setEditForm] = useState({ subject_id: '', room_id: '', teacher_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPeriods();
    fetchSubjects();
    fetchRooms();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedSection) fetchTimetable();
  }, [selectedSection, selectedDay]);

  const fetchPeriods = async () => {
    try {
      const res = await api.get('/timetable/periods');
      setPeriods(res.data);
    } catch { console.error('periods fetch failed'); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/sessions/subjects');
      setSubjects(res.data);
    } catch { console.error('subjects fetch failed'); }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/sessions/rooms');
      setRooms(res.data);
    } catch { console.error('rooms fetch failed'); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/students/teachers');
      setTeachers(res.data);
    } catch { console.error('teachers fetch failed'); }
  };

  const fetchTimetable = async () => {
    try {
      const res = await api.get('/timetable/section', {
        params: { section: selectedSection, day: selectedDay }
      });
      setTimetable(res.data);
    } catch { console.error('timetable fetch failed'); }
  };

  const getEntry = (period_no) =>
    timetable.find(t => t.period_no === period_no);

  const openEdit = (period) => {
    const entry = getEntry(period.period_no);
    setEditSlot(period);
    setEditForm({
      subject_id: entry?.subjects?.id || '',
      room_id: entry?.rooms?.id || '',
      teacher_id: entry?.users?.id || '',
      notes: entry?.notes || '',
    });
  };

  const saveSlot = async () => {
    if (!editSlot) return;
    setSaving(true);
    try {
      await api.post('/timetable/save', {
        section: selectedSection,
        day_of_week: selectedDay,
        period_no: editSlot.period_no,
        subject_id: editForm.subject_id || null,
        room_id: editForm.room_id || null,
        teacher_id: editForm.teacher_id || null,
        notes: editForm.notes || null,
      });
      toast.success('Saved!');
      setEditSlot(null);
      fetchTimetable();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const clearSlot = async (period_no) => {
    if (!confirm('Clear this period?')) return;
    try {
      await api.delete('/timetable/delete', {
        data: { section: selectedSection, day_of_week: selectedDay, period_no }
      });
      toast.success('Period cleared');
      fetchTimetable();
    } catch { toast.error('Could not clear period'); }
  };

  return (
    <div>
      <style>{`
        .tt-row:hover { background: #F4F6F9; }
        .tt-edit-btn:hover { background: #2C3E6B !important; color: #fff !important; }
        .tt-clear-btn:hover { background: #FEF2F2 !important; color: #DC2626 !important; }
        .cdgi-select:focus, .cdgi-input:focus { border-color: #2C3E6B !important; outline: none; }
      `}</style>

      {/* Section + Day Selector */}
      <div style={ts.topControls}>
        <div style={ts.controlGroup}>
          <label style={ts.controlLabel}>Section</label>
          <select className="cdgi-select" style={ts.controlSelect}
            value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
            <option value="">-- Select Section --</option>
            {Object.entries(SECTIONS_MAP).map(([dept, secs]) => (
              <optgroup key={dept} label={`${dept} Department`}>
                {secs.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div style={ts.controlGroup}>
          <label style={ts.controlLabel}>Day</label>
          <div style={ts.dayTabs}>
            {DAYS.map((d, i) => (
              <button key={i}
                style={{ ...ts.dayTab, ...(selectedDay === i ? ts.dayTabActive : {}) }}
                onClick={() => setSelectedDay(i)}>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedSection ? (
        <div style={ts.placeholder}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 13, color: '#4A4A4A', fontWeight: 500 }}>Select a section to view & edit timetable</div>
        </div>
      ) : (
        <>
          {/* Header info */}
          <div style={ts.ttHeader}>
            <span style={ts.ttHeaderTitle}>{selectedSection} — {DAYS[selectedDay]}</span>
            <span style={ts.ttHeaderSub}>{periods.filter(p => !p.is_break).length} periods · {periods.filter(p => p.is_break).length} breaks</span>
          </div>

          {/* Timetable grid */}
          <div style={ts.ttGrid}>
            {periods.map(period => {
              const entry = getEntry(period.period_no);
              const isBreak = period.is_break;

              if (isBreak) {
                return (
                  <div key={period.period_no} style={ts.breakRow}>
                    <span style={ts.breakLabel}>{period.label}</span>
                    <span style={ts.breakTime}>{period.start_time.slice(0, 5)} – {period.end_time.slice(0, 5)}</span>
                  </div>
                );
              }

              return (
                <div key={period.period_no} className="tt-row" style={ts.ttRow}>
                  {/* Period info */}
                  <div style={ts.ttPeriodCol}>
                    <div style={ts.ttPeriodLabel}>{period.label}</div>
                    <div style={ts.ttPeriodTime}>{period.start_time.slice(0, 5)} – {period.end_time.slice(0, 5)}</div>
                  </div>

                  {/* Entry */}
                  <div style={ts.ttEntryCol}>
                    {entry ? (
                      <div style={ts.entryFilled}>
                        <div style={ts.entrySubject}>{entry.subjects?.name || entry.notes || 'Free'}</div>
                        {entry.subjects?.code && <div style={ts.entryCode}>{entry.subjects.code}</div>}
                        {entry.users?.name && <div style={ts.entryTeacher}>👤 {entry.users.name}</div>}
                        {entry.rooms?.name && <div style={ts.entryRoom}>🏫 {entry.rooms.name}</div>}
                      </div>
                    ) : (
                      <div style={ts.entryEmpty}>— Not assigned —</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={ts.ttActionCol}>
                    <button className="tt-edit-btn" style={ts.editBtn}
                      onClick={() => openEdit(period)}>
                      ✏ Edit
                    </button>
                    {entry && (
                      <button className="tt-clear-btn" style={ts.clearBtn}
                        onClick={() => clearSlot(period.period_no)}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Slot Modal */}
      {editSlot && (
        <div style={ts.overlay}>
          <div style={ts.modal}>
            <div style={ts.modalHeader}>
              <div>
                <div style={ts.modalTitle}>Edit Period — {editSlot.label}</div>
                <div style={ts.modalSub}>{selectedSection} · {DAYS[selectedDay]} · {editSlot.start_time?.slice(0,5)} – {editSlot.end_time?.slice(0,5)}</div>
              </div>
              <button style={ts.modalClose} onClick={() => setEditSlot(null)}>✕</button>
            </div>
            <div style={ts.modalBody}>

              <div style={ts.formRow}>
                <label style={ts.formLabel}>Subject</label>
                <select className="cdgi-select" style={ts.formInput}
                  value={editForm.subject_id}
                  onChange={e => setEditForm({ ...editForm, subject_id: e.target.value })}>
                  <option value="">-- No Subject --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div style={ts.formRow}>
                <label style={ts.formLabel}>Teacher / Faculty</label>
                <select className="cdgi-select" style={ts.formInput}
                  value={editForm.teacher_id}
                  onChange={e => setEditForm({ ...editForm, teacher_id: e.target.value })}>
                  <option value="">-- No Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.users?.name || t.id}</option>
                  ))}
                </select>
              </div>

              <div style={ts.formRow}>
                <label style={ts.formLabel}>Room</label>
                <select className="cdgi-select" style={ts.formInput}
                  value={editForm.room_id}
                  onChange={e => setEditForm({ ...editForm, room_id: e.target.value })}>
                  <option value="">-- No Room --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div style={ts.formRow}>
                <label style={ts.formLabel}>Notes (optional — eg. Mentoring, Library)</label>
                <input className="cdgi-input" style={ts.formInput} type="text"
                  placeholder="eg. Mentoring / Library / Aptitude Training"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>

              <div style={{ background: '#F4F6F9', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#8A8A8A' }}>
                💡 Subject khali chhodo agar free period ya special activity hai. Notes mein reason likho.
              </div>
            </div>
            <div style={ts.modalFooter}>
              <button style={ts.btnCancel} onClick={() => setEditSlot(null)}>Cancel</button>
              <button style={{ ...ts.btnPrimary, opacity: saving ? 0.7 : 1 }}
                onClick={saveSlot} disabled={saving}>
                {saving ? 'Saving...' : 'Save Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ts = {
  topControls: { display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  controlLabel: { fontSize: 11, fontWeight: 600, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '.05em' },
  controlSelect: { padding: '9px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', background: '#fff', minWidth: 180 },
  dayTabs: { display: 'flex', gap: 4 },
  dayTab: { padding: '8px 14px', border: '1px solid #D0D5DF', borderRadius: 4, background: '#fff', fontSize: 12, fontWeight: 500, color: '#4A4A4A', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
  dayTabActive: { background: '#2C3E6B', color: '#fff', borderColor: '#2C3E6B' },

  placeholder: { textAlign: 'center', padding: '48px 24px', color: '#8A8A8A' },

  ttHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '10px 14px', background: '#2C3E6B', borderRadius: 6 },
  ttHeaderTitle: { fontSize: 13, fontWeight: 600, color: '#fff' },
  ttHeaderSub: { fontSize: 11, color: 'rgba(255,255,255,.6)' },

  ttGrid: { border: '1px solid #D0D5DF', borderRadius: 6, overflow: 'hidden' },
  breakRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 14px', background: '#FEF9C3', borderBottom: '1px solid #FDE047' },
  breakLabel: { fontSize: 11, fontWeight: 600, color: '#854D0E' },
  breakTime: { fontSize: 11, color: '#854D0E' },

  ttRow: { display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #D0D5DF', gap: 12, transition: 'background .15s' },
  ttPeriodCol: { width: 130, flexShrink: 0 },
  ttPeriodLabel: { fontSize: 12, fontWeight: 600, color: '#2C3E6B' },
  ttPeriodTime: { fontSize: 11, color: '#8A8A8A', marginTop: 2 },
  ttEntryCol: { flex: 1 },
  ttActionCol: { display: 'flex', gap: 6, flexShrink: 0 },

  entryFilled: { display: 'flex', flexWrap: 'wrap', gap: '2px 12px', alignItems: 'center' },
  entrySubject: { fontSize: 13, fontWeight: 600, color: '#1A1A1A' },
  entryCode: { fontSize: 11, color: '#8A8A8A' },
  entryTeacher: { fontSize: 11, color: '#4A4A4A' },
  entryRoom: { fontSize: 11, color: '#4A4A4A' },
  entryEmpty: { fontSize: 12, color: '#C0C4CC', fontStyle: 'italic' },

  editBtn: { padding: '5px 12px', background: '#F4F6F9', border: '1px solid #D0D5DF', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", color: '#2C3E6B', fontWeight: 500, transition: 'all .15s' },
  clearBtn: { padding: '5px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", color: '#DC2626', transition: 'all .15s' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 },
  modal: { background: '#fff', borderRadius: 6, width: 460, maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,.18)' },
  modalHeader: { background: '#2C3E6B', color: '#fff', padding: '16px 20px', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  modalTitle: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  modalSub: { fontSize: 11, color: 'rgba(255,255,255,.6)' },
  modalClose: { background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1, marginTop: -2 },
  modalBody: { padding: 20 },
  modalFooter: { padding: '14px 20px', borderTop: '1px solid #D0D5DF', display: 'flex', justifyContent: 'flex-end', gap: 10 },
  formRow: { marginBottom: 14 },
  formLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#4A4A4A', marginBottom: 5 },
  formInput: { width: '100%', padding: '9px 12px', border: '1px solid #D0D5DF', borderRadius: 4, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: '#1A1A1A', background: '#fff' },
  btnCancel: { background: '#fff', border: '1px solid #D0D5DF', color: '#4A4A4A', borderRadius: 4, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
  btnPrimary: { background: '#2C3E6B', color: '#fff', border: 'none', borderRadius: 4, padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
};
