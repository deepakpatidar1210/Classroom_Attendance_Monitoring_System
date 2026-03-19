import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/attendance/student/${user.id}`);
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
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
        <View>
          <Text style={s.greeting}>Good morning,</Text>
          <Text style={s.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={s.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Overall card */}
      <View style={s.overallCard}>
        <Text style={s.overallLabel}>Overall attendance</Text>
        <Text style={[s.overallPct, { color: pctColor }]}>{percentage}%</Text>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${percentage}%`, backgroundColor: pctColor }]} />
        </View>
        <View style={s.pillRow}>
          <View style={s.pill}><Text style={s.pillGreen}>{present} Present</Text></View>
          <View style={s.pill}><Text style={s.pillRed}>{totalClasses - present} Absent</Text></View>
          <View style={s.pill}><Text style={s.pillGray}>{totalClasses} Total</Text></View>
        </View>
      </View>

      {/* Mark attendance button */}
      <TouchableOpacity style={s.markBtn} onPress={() => navigation.navigate('MarkAttendance')}>
        <Text style={s.markBtnText}>Mark Attendance</Text>
      </TouchableOpacity>

      {/* Recent records */}
      <Text style={s.sectionLabel}>Recent records</Text>
      {attendance.slice(0, 10).map(record => (
        <View key={record.id} style={s.recordRow}>
          <View>
            <Text style={s.recordSubject}>{record.sessions?.subjects?.name || 'Class'}</Text>
            <Text style={s.recordDate}>{new Date(record.marked_at).toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={[s.badge, record.status === 'present' ? s.badgeGreen : s.badgeRed]}>
            <Text style={[s.badgeText, { color: record.status === 'present' ? '#0F6E56' : '#A32D2D' }]}>
              {record.status === 'present' ? 'Present' : 'Absent'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f7f6f3' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 0.5, borderColor: '#e8e6e0' },
  greeting: { fontSize: 12, color: '#888' },
  name: { fontSize: 18, fontWeight: '600', color: '#111' },
  logout: { fontSize: 13, color: '#888' },
  overallCard: { margin: 16, backgroundColor: '#111', borderRadius: 16, padding: 20 },
  overallLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  overallPct: { fontSize: 42, fontWeight: '600', lineHeight: 48 },
  barBg: { height: 4, backgroundColor: '#333', borderRadius: 2, marginTop: 14 },
  barFill: { height: 4, borderRadius: 2 },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#222', borderRadius: 20 },
  pillGreen: { fontSize: 11, color: '#5DCAA5', fontWeight: '500' },
  pillRed: { fontSize: 11, color: '#F09595', fontWeight: '500' },
  pillGray: { fontSize: 11, color: '#888', fontWeight: '500' },
  markBtn: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center' },
  markBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: '#888', marginHorizontal: 16, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#e8e6e0' },
  recordSubject: { fontSize: 14, fontWeight: '500', color: '#111' },
  recordDate: { fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#E1F5EE' },
  badgeRed: { backgroundColor: '#FCEBEB' },
  badgeText: { fontSize: 12, fontWeight: '500' },
});