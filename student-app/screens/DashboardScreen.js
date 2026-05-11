import { useEffect, useState } from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar, SafeAreaView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const COLORS = {
  navy: '#1A3644', navyDark: '#132832', navyLight: '#2C7B8E',
  gold: '#F59E0B', bg: '#EEF1F6', white: '#fff', surface: '#F4F6F9',
  border: '#DDE1EA', text: '#1A1A1A', text2: '#4A4A4A', text3: '#9AA0AD',
  green: '#16A34A', greenBg: '#DCFCE7', greenLight: '#86EFAC',
  red: '#DC2626', redBg: '#FEF2F2', redLight: '#FCA5A5',
  yellow: '#D97706', yellowBg: '#FEF3C7',
};

const SUBJECT_COLORS = ['#1A3644','#7C3AED','#0891B2','#D97706','#DC2626'];

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr  = d.getFullYear();
  return `${yr}-${mon}-${day}`;
};

const displayDate = (dateStr) => {
  if (!dateStr) return 'Select date';
  const [yr, mon, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(mon)-1]} ${yr}`;
};

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  // FIX: attendance = detailed records (present + absent both)
  //      stats = { total, present, absent } — from /attendance/stats/:id
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Date picker state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetchAttendance();
    fetchStats();
  }, []);

  // FIX: /attendance/stats/:id ab seedha table se count karta hai
  //      (session create hone pe absent rows insert ho jaati hain, isliye sahi data milta hai)
  const fetchStats = async () => {
    try {
      const res = await api.get(`/attendance/stats/${user.id}`);
      setStats(res.data);
    } catch (err) {
      console.error('stats fetch failed', err);
    }
  };

  // FIX: /attendance/student/:id ab absent records bhi return karta hai
  //      (pehle sirf present records the — absent tab dikhta tha jab student ne mark kiya ho)
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
    await Promise.all([fetchAttendance(), fetchStats()]);
    setRefreshing(false);
  };

  const { total: totalClasses, present, absent } = stats;
  const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
  const pctColor = percentage >= 75 ? COLORS.green : percentage >= 60 ? COLORS.yellow : COLORS.red;

  // Subject-wise breakdown — sirf present records se calculate karo (absent rows mein bhi subjects hain)
  const subjectMap = {};
  attendance.forEach(a => {
    const name = a.sessions?.subjects?.name || 'Class';
    if (!subjectMap[name]) subjectMap[name] = { present: 0, total: 0 };
    subjectMap[name].total++;
    if (a.status === 'present') subjectMap[name].present++;
  });
  const subjects = Object.entries(subjectMap);

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
  const fTotal   = displayList.length;
  const fPresent = displayList.filter(a => a.status === 'present').length;
  const fAbsent  = displayList.filter(a => a.status === 'absent').length;
  const fPct     = fTotal > 0 ? Math.round((fPresent / fTotal) * 100) : 0;
  const dateOrder = [...new Set(displayList.map(a => new Date(a.marked_at).toISOString().split('T')[0]))];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.navy }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={s.topbar}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.userName} numberOfLines={1} ellipsizeMode="tail">
            {user?.name || 'Student'}
          </Text>
        </View>
        <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={s.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >

          {/* ===== HOME TAB ===== */}
          {activeTab === 'home' && (
            <>
              <View style={s.heroCard}>
                <Text style={s.heroLabel}>Overall Attendance</Text>
                {/* FIX: percentage ab correct hai — total mein absent bhi count hote hain */}
                <Text style={[s.heroPct, { color: pctColor }]}>{percentage}%</Text>
                <Text style={s.heroSub}>
                  {user?.enrollment_no || '—'} · {user?.section || 'Student'}
                </Text>
                <View style={s.heroStats}>
                  <View style={s.heroStat}>
                    <Text style={s.heroStatVal}>{present}</Text>
                    <Text style={s.heroStatLabel}>Present</Text>
                  </View>
                  <View style={s.heroStat}>
                    <Text style={s.heroStatVal}>{absent}</Text>
                    <Text style={s.heroStatLabel}>Absent</Text>
                  </View>
                  <View style={s.heroStat}>
                    <Text style={s.heroStatVal}>{totalClasses}</Text>
                    <Text style={s.heroStatLabel}>Total</Text>
                  </View>
                </View>
              </View>

              {percentage < 75 && totalClasses > 0 && (
                <View style={s.alertBanner}>
                  <Text style={s.alertIcon}>⚠️</Text>
                  <Text style={s.alertText}>
                    Your attendance is <Text style={{ fontWeight: '700' }}>{percentage}%</Text> — below 75% requirement!
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={s.markBtn}
                onPress={() => navigation.navigate('MarkAttendance')}
                activeOpacity={0.85}
              >
                <Text style={s.markBtnIcon}>📷</Text>
                <Text style={s.markBtnText}>Mark Attendance</Text>
              </TouchableOpacity>

              {subjects.length > 0 && (
                <View style={s.sectionPad}>
                  <Text style={s.sectionTitle}>Subject-wise</Text>
                  <View style={s.subjectCard}>
                    {subjects.map(([name, data], i) => {
                      const pct = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
                      const c = pct >= 75 ? COLORS.green : pct >= 65 ? COLORS.yellow : COLORS.red;
                      return (
                        <View key={name} style={[s.subjectRow, i < subjects.length - 1 && { marginBottom: 12 }]}>
                          <View style={s.subjectInfo}>
                            <View style={[s.subjectDot, { backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }]} />
                            <Text style={s.subjectName}>{name}</Text>
                          </View>
                          <Text style={[s.subjectPct, { color: c }]}>{pct}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={s.profileCard}>
                <View style={s.pfAvatar}>
                  <Text style={s.pfInitials}>
                    {(user?.name || 'ST').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.pfName} numberOfLines={1}>{user?.name || 'Student'}</Text>
                  <Text style={s.pfDetail} numberOfLines={1}>{user?.enrollment_no || '—'}</Text>
                </View>
                <TouchableOpacity style={s.logoutBtn} onPress={logout}>
                  <Text style={s.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ===== ATTENDANCE TAB ===== */}
          {activeTab === 'attendance' && (
            <View style={s.vaLayout}>

              {/* DATE PICKER CARD */}
              <View style={s.dateCard}>
                <Text style={s.dateLabel}>Select Duration</Text>
                <View style={s.dateRow}>

                  {/* FROM */}
                  <View style={s.dateInputWrap}>
                    <Text style={s.dateInputLabel}>From</Text>
                    <TouchableOpacity
                      style={s.datePressable}
                      onPress={() => { setShowToPicker(false); setShowFromPicker(true); }}
                    >
                      <Text style={[s.datePressableText, !fromDate && { color: COLORS.text3 }]}>
                        {fromDate ? displayDate(fromDate) : 'Select date'}
                      </Text>
                      <Text style={s.calIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>

                  {/* TO */}
                  <View style={s.dateInputWrap}>
                    <Text style={s.dateInputLabel}>To</Text>
                    <TouchableOpacity
                      style={s.datePressable}
                      onPress={() => { setShowFromPicker(false); setShowToPicker(true); }}
                    >
                      <Text style={[s.datePressableText, !toDate && { color: COLORS.text3 }]}>
                        {toDate ? displayDate(toDate) : 'Select date'}
                      </Text>
                      <Text style={s.calIcon}>📅</Text>
                    </TouchableOpacity>
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

              {/* DATE PICKERS */}
              {showFromPicker && (
                <DateTimePicker
                  value={fromDate ? new Date(fromDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowFromPicker(false);
                    if (selectedDate) setFromDate(formatDate(selectedDate));
                  }}
                  maximumDate={new Date()}
                />
              )}
              {showToPicker && (
                <DateTimePicker
                  value={toDate ? new Date(toDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowToPicker(false);
                    if (selectedDate) setToDate(formatDate(selectedDate));
                  }}
                  maximumDate={new Date()}
                />
              )}

              {/* STAT PILLS — filter applied hone par filtered stats dikhao */}
              <View style={s.statRow}>
                <View style={s.statPill}>
                  <Text style={[s.statVal, { color: COLORS.navy }]}>{fTotal}</Text>
                  <Text style={s.statLabel}>Total</Text>
                </View>
                <View style={s.statPill}>
                  <Text style={[s.statVal, { color: COLORS.green }]}>{fPresent}</Text>
                  <Text style={s.statLabel}>Present</Text>
                </View>
                <View style={s.statPill}>
                  <Text style={[s.statVal, { color: COLORS.red }]}>{fAbsent}</Text>
                  <Text style={s.statLabel}>Absent</Text>
                </View>
                <View style={s.statPill}>
                  <Text style={[s.statVal, { color: COLORS.navy }]}>{fPct}%</Text>
                  <Text style={s.statLabel}>Percentage</Text>
                </View>
              </View>

              {/* DETAIL TABLE */}
              <View style={s.tableCard}>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHead, { width: 32 }]}>Sr.</Text>
                  <Text style={[s.tableHead, { flex: 1.4 }]}>Date</Text>
                  <Text style={[s.tableHead, { width: 48 }]}>Per.</Text>
                  <Text style={[s.tableHead, { flex: 2 }]}>Subject</Text>
                  <Text style={[s.tableHead, { width: 44, textAlign: 'center' }]}>Status</Text>
                </View>
                <ScrollView style={s.tableScroll} nestedScrollEnabled>
                  {displayList.length === 0 ? (
                    <Text style={s.emptyText}>
                      {filterApplied ? 'No records in selected range' : 'No attendance records found'}
                    </Text>
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
                            <Text style={[s.tableCell, { width: 32 }]}>{i + 1}</Text>
                            <Text style={[s.tableCell, { flex: 1.4, color: dateColor, fontWeight: '500' }]}>
                              {new Date(a.marked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                            <Text style={[s.tableCell, { width: 48 }]}>{a.sessions?.period_no || 1}</Text>
                            <Text style={[s.tableCell, { flex: 2 }]}>{a.sessions?.subjects?.name || 'Class'}</Text>
                            <View style={{ width: 44, alignItems: 'center' }}>
                              <View style={[s.statusBadge, { backgroundColor: isPresent ? COLORS.greenBg : COLORS.redBg }]}>
                                <Text style={[s.statusText, { color: isPresent ? COLORS.green : COLORS.red }]}>
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
            </View>
          )}
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={s.bottomNav}>
          <TouchableOpacity style={s.navBtn} onPress={() => setActiveTab('home')}>
            <Text style={s.navIcon}>🏠</Text>
            <Text style={[s.navLabel, activeTab === 'home' && s.navLabelActive]}>Home</Text>
            {activeTab === 'home' && <View style={s.navDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={() => setActiveTab('attendance')}>
            <Text style={s.navIcon}>📊</Text>
            <Text style={[s.navLabel, activeTab === 'attendance' && s.navLabelActive]}>Attendance</Text>
            {activeTab === 'attendance' && <View style={s.navDot} />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, paddingTop: (RNStatusBar.currentHeight || 0) + 10,
    backgroundColor: COLORS.navy,
  },
  greeting: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  userName: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 1 },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 19, flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIcon: { fontSize: 18, color: '#fff' },
  heroCard: { margin: 16, backgroundColor: COLORS.navy, borderRadius: 20, padding: 20 },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  heroPct: { fontSize: 46, fontWeight: '700', lineHeight: 52 },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, marginBottom: 14 },
  heroStats: { flexDirection: 'row', gap: 10 },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, alignItems: 'center' },
  heroStatVal: { fontSize: 20, fontWeight: '700', color: '#fff' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  alertBanner: { marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.redBg, borderWidth: 1, borderColor: COLORS.redLight, borderRadius: 10, padding: 12 },
  alertIcon: { fontSize: 15 },
  alertText: { flex: 1, fontSize: 12, color: COLORS.red, lineHeight: 18 },
  markBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.gold, borderRadius: 14, padding: 16, elevation: 4 },
  markBtnIcon: { fontSize: 20 },
  markBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.navyDark },
  sectionPad: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  subjectCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, elevation: 2 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  subjectDot: { width: 8, height: 8, borderRadius: 4 },
  subjectName: { fontSize: 12, fontWeight: '500', color: COLORS.text2 },
  subjectPct: { fontSize: 13, fontWeight: '700' },
  profileCard: { marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, elevation: 2 },
  pfAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pfInitials: { fontSize: 14, fontWeight: '700', color: '#fff' },
  pfName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  pfDetail: { fontSize: 11, color: COLORS.text3 },
  logoutBtn: { backgroundColor: COLORS.redBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, flexShrink: 0 },
  logoutText: { fontSize: 11, fontWeight: '500', color: COLORS.red },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 20, paddingTop: 8 },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, fontWeight: '500', color: COLORS.text3, marginTop: 2 },
  navLabelActive: { color: COLORS.navy },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.navy, marginTop: 3 },
  vaLayout: { padding: 16 },
  dateCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  dateLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateInputWrap: { flex: 1 },
  dateInputLabel: { fontSize: 10, color: COLORS.text3, marginBottom: 4 },
  datePressable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8, padding: 8 },
  datePressableText: { fontSize: 11, color: COLORS.text, flex: 1 },
  calIcon: { fontSize: 14 },
  applyBtn: { backgroundColor: COLORS.navy, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statPill: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statVal: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 9, color: COLORS.text3, marginTop: 2 },
  tableCard: { backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden', elevation: 2 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A6FA5', paddingVertical: 9, paddingHorizontal: 10 },
  tableHead: { fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.4 },
  tableScroll: { maxHeight: 320 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableCell: { fontSize: 11, color: COLORS.text2 },
  statusBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: COLORS.text3, fontSize: 13, padding: 24 },
});
