import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function HistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/attendance/student/${user.id}`);
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const totalClasses = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
  const pctColor = percentage >= 75 ? '#1D9E75' : percentage >= 60 ? '#EF9F27' : '#E24B4A';

  return (
    <ScrollView
      style={s.wrap}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Attendance History</Text>
      </View>

      {/* Summary card */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Overall attendance</Text>
        <Text style={[s.summaryPct, { color: pctColor }]}>{percentage}%</Text>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${percentage}%`, backgroundColor: pctColor }]} />
        </View>
        <View style={s.pillRow}>
          <View style={s.pill}><Text style={s.pillGreen}>{present} Present</Text></View>
          <View style={s.pill}><Text style={s.pillRed}>{totalClasses - present} Absent</Text></View>
          <View style={s.pill}><Text style={s.pillGray}>{totalClasses} Total</Text></View>
        </View>
      </View>

      {/* Records list */}
      <Text style={s.sectionLabel}>All records</Text>

      {loading ? (
        <Text style={s.emptyText}>Loading...</Text>
      ) : attendance.length === 0 ? (
        <Text style={s.emptyText}>No attendance records found</Text>
      ) : (
        attendance.map(record => (
          <View key={record.id} style={s.recordRow}>
            <View>
              <Text style={s.recordSubject}>
                {record.sessions?.subjects?.name || 'Class'}
              </Text>
              <Text style={s.recordDate}>
                {new Date(record.marked_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </Text>
            </View>
            <View style={[s.badge, record.status === 'present' ? s.badgeGreen : s.badgeRed]}>
              <Text style={[s.badgeText, { color: record.status === 'present' ? '#0F6E56' : '#A32D2D' }]}>
                {record.status === 'present' ? 'Present' : 'Absent'}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f7f6f3' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#e8e6e0' },
  back: { fontSize: 14, color: '#888' },
  title: { fontSize: 18, fontWeight: '600', color: '#111' },
  summaryCard: { margin: 16, backgroundColor: '#111', borderRadius: 16, padding: 20 },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  summaryPct: { fontSize: 42, fontWeight: '600', lineHeight: 48 },
  barBg: { height: 4, backgroundColor: '#333', borderRadius: 2, marginTop: 14 },
  barFill: { height: 4, borderRadius: 2 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#222', borderRadius: 20 },
  pillGreen: { fontSize: 11, color: '#5DCAA5', fontWeight: '500' },
  pillRed: { fontSize: 11, color: '#F09595', fontWeight: '500' },
  pillGray: { fontSize: 11, color: '#888', fontWeight: '500' },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: '#888', marginHorizontal: 16, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#e8e6e0' },
  recordSubject: { fontSize: 14, fontWeight: '500', color: '#111' },
  recordDate: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#E1F5EE' },
  badgeRed: { backgroundColor: '#FCEBEB' },
  badgeText: { fontSize: 12, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 13, marginTop: 40 },
});
