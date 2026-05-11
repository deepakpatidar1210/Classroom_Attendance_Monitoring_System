import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity, StatusBar, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const COLORS = {
  navy: '#1A3644', navyDark: '#132832', gold: '#F59E0B',
  bg: '#EEF1F6', white: '#fff', surface: '#F4F6F9',
  border: '#DDE1EA', text: '#1A1A1A', text2: '#4A4A4A', text3: '#9AA0AD',
  green: '#16A34A', greenBg: '#DCFCE7',
  red: '#DC2626', redBg: '#FEF2F2',
  yellow: '#D97706',
};

export default function HistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [filterApplied, setFilterApplied] = useState(false);

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

  const applyFilter = () => {
    if (!fromDate || !toDate) return;
    const f = attendance.filter(a => {
      const d = new Date(a.marked_at).toISOString().split('T')[0];
      return d >= fromDate && d <= toDate;
    });
    setFiltered(f);
    setFilterApplied(true);
  };

  const clearFilter = () => {
    setFiltered([]);
    setFilterApplied(false);
    setFromDate('');
    setToDate('');
  };

  const displayList = filterApplied ? filtered : attendance;
  const total   = displayList.length;
  const present = displayList.filter(a => a.status === 'present').length;
  const absent  = total - present;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
  const pctColor = pct >= 75 ? COLORS.green : pct >= 60 ? COLORS.yellow : COLORS.red;

  const dateOrder = [...new Set(
    displayList.map(a => new Date(a.marked_at).toISOString().split('T')[0])
  )];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.navy }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Attendance History</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* DATE FILTER */}
        <View style={s.dateCard}>
          <Text style={s.dateTitle}>Filter by Duration</Text>
          <View style={s.dateRow}>
            <View style={s.dateField}>
              <Text style={s.dateFieldLabel}>From</Text>
              <View style={s.dateInput}>
                <Text
                  style={[s.dateInputText, !fromDate && { color: COLORS.text3 }]}
                  onPress={() => {}}
                >
                  {fromDate || 'YYYY-MM-DD'}
                </Text>
              </View>
            </View>
            <View style={s.dateField}>
              <Text style={s.dateFieldLabel}>To</Text>
              <View style={s.dateInput}>
                <Text
                  style={[s.dateInputText, !toDate && { color: COLORS.text3 }]}
                  onPress={() => {}}
                >
                  {toDate || 'YYYY-MM-DD'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={s.applyBtn} onPress={applyFilter}>
              <Text style={s.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {filterApplied && (
            <TouchableOpacity onPress={clearFilter} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: COLORS.red }}>✕ Clear filter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* STATS ROW */}
        <View style={s.statsRow}>
          <View style={s.statPill}>
            <Text style={[s.statVal, { color: COLORS.navy }]}>{total}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statPill}>
            <Text style={[s.statVal, { color: COLORS.green }]}>{present}</Text>
            <Text style={s.statLabel}>Present</Text>
          </View>
          <View style={s.statPill}>
            <Text style={[s.statVal, { color: COLORS.red }]}>{absent}</Text>
            <Text style={s.statLabel}>Absent</Text>
          </View>
          <View style={s.statPill}>
            <Text style={[s.statVal, { color: pctColor }]}>{pct}%</Text>
            <Text style={s.statLabel}>Percentage</Text>
          </View>
        </View>

        {/* DETAIL TABLE */}
        <View style={s.tableCard}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: 30 }]}>Sr.</Text>
            <Text style={[s.th, { flex: 1.4 }]}>Date</Text>
            <Text style={[s.th, { width: 40 }]}>Per.</Text>
            <Text style={[s.th, { flex: 2 }]}>Subject</Text>
            <Text style={[s.th, { width: 46, textAlign: 'center' }]}>Status</Text>
          </View>

          <ScrollView nestedScrollEnabled style={s.tableScroll}>
            {loading ? (
              <Text style={s.emptyText}>Loading...</Text>
            ) : displayList.length === 0 ? (
              <Text style={s.emptyText}>No attendance records found</Text>
            ) : (
              displayList
                .sort((a, b) => new Date(b.marked_at) - new Date(a.marked_at))
                .map((a, i) => {
                  const dateStr = new Date(a.marked_at).toISOString().split('T')[0];
                  const groupIdx = dateOrder.indexOf(dateStr);
                  const isEven = groupIdx % 2 === 0;
                  const rowBg = isEven ? '#FFF0F0' : '#fff';
                  const dateColor = isEven ? COLORS.red : COLORS.navy;
                  const isPresent = a.status === 'present';

                  return (
                    <View key={a.id || i} style={[s.tableRow, { backgroundColor: rowBg }]}>
                      <Text style={[s.td, { width: 30 }]}>{i + 1}</Text>
                      <Text style={[s.td, { flex: 1.4, color: dateColor, fontWeight: '500' }]}>
                        {new Date(a.marked_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </Text>
                      <Text style={[s.td, { width: 40 }]}>
                        {a.sessions?.period_no || 1}
                      </Text>
                      <Text style={[s.td, { flex: 2 }]}>
                        {a.sessions?.subjects?.name || 'Class'}
                      </Text>
                      <View style={{ width: 46, alignItems: 'center' }}>
                        <View style={[
                          s.statusBadge,
                          { backgroundColor: isPresent ? COLORS.greenBg : COLORS.redBg }
                        ]}>
                          <Text style={[
                            s.statusText,
                            { color: isPresent ? COLORS.green : COLORS.red }
                          ]}>
                            {isPresent ? 'P' : 'A'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: COLORS.navy,
  },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, width: 48 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },

  dateCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  dateTitle: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateField: { flex: 1 },
  dateFieldLabel: { fontSize: 10, color: COLORS.text3, marginBottom: 4 },
  dateInput: {
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 8, padding: 9,
  },
  dateInputText: { fontSize: 12, color: COLORS.text },
  applyBtn: {
    backgroundColor: COLORS.navy, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statPill: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statVal: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 9, color: COLORS.text3, marginTop: 2 },

  tableCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4A6FA5', paddingVertical: 10, paddingHorizontal: 10,
  },
  th: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.4 },
  tableScroll: { maxHeight: 400 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  td: { fontSize: 11, color: COLORS.text2 },
  statusBadge: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: COLORS.text3, fontSize: 13, padding: 24 },
});
