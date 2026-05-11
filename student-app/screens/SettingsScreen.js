import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, StatusBar, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const COLORS = {
  navy: '#1A3644', navyDark: '#132832', gold: '#F59E0B',
  bg: '#EEF1F6', white: '#fff', surface: '#F4F6F9',
  border: '#DDE1EA', text: '#1A1A1A', text2: '#4A4A4A', text3: '#9AA0AD',
  green: '#16A34A', greenBg: '#DCFCE7',
  red: '#DC2626', redBg: '#FEF2F2',
};

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const initials = (user?.name || 'ST').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (newPass.length < 8) {
      return Alert.alert('Error', 'New password must be at least 8 characters');
    }
    if (newPass !== confirmPass) {
      return Alert.alert('Error', 'New password and confirm password do not match');
    }
    if (currentPass === newPass) {
      return Alert.alert('Error', 'New password must be different from current password');
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      Alert.alert('Success!', 'Password changed successfully. Please login again.', [
        { text: 'OK', onPress: () => { logout(); } }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  const PassInput = ({ label, value, onChangeText, show, onToggle }) => (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={s.passRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.text3}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity style={s.eyeBtn} onPress={onToggle}>
          <Text style={s.eyeIcon}>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.navy }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{user?.name || 'Student'}</Text>
            <Text style={s.profileDetail}>{user?.enrollment_no || '—'}</Text>
            <Text style={s.profileDetail}>{user?.email || '—'}</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>Security</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>Change Password</Text>
          <Text style={s.cardSub}>Enter your current password and choose a new one</Text>

          <PassInput label="Current Password" value={currentPass} onChangeText={setCurrentPass} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
          <PassInput label="New Password" value={newPass} onChangeText={setNewPass} show={showNew} onToggle={() => setShowNew(!showNew)} />
          <PassInput label="Confirm New Password" value={confirmPass} onChangeText={setConfirmPass} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />

          <View style={s.rulesBox}>
            <Text style={s.rulesTitle}>Password requirements:</Text>
            <Text style={[s.rule, newPass.length >= 8 && s.ruleMet]}>• Minimum 8 characters</Text>
            <Text style={[s.rule, /[A-Z]/.test(newPass) && s.ruleMet]}>• At least 1 uppercase letter</Text>
            <Text style={[s.rule, /[0-9]/.test(newPass) && s.ruleMet]}>• At least 1 number</Text>
            <Text style={[s.rule, /[!@#$%^&*]/.test(newPass) && s.ruleMet]}>• At least 1 special character</Text>
          </View>

          <TouchableOpacity style={[s.saveBtn, loading && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.navyDark} /> : <Text style={s.saveBtnText}>Save Password</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLabel}>Account</Text>

        <TouchableOpacity style={s.logoutCard} onPress={() => {
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
          ]);
        }}>
          <Text style={s.logoutIcon}>⎋</Text>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.navy },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, width: 48 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  profileDetail: { fontSize: 12, color: COLORS.text3 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: COLORS.text3, marginBottom: 16 },
  inputWrap: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '500', color: COLORS.text2, marginBottom: 5 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8, padding: 11, fontSize: 14, color: COLORS.text },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { width: 44, height: 44, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  eyeIcon: { fontSize: 16 },
  rulesBox: { backgroundColor: COLORS.surface, borderRadius: 8, padding: 12, marginBottom: 16 },
  rulesTitle: { fontSize: 11, fontWeight: '600', color: COLORS.text2, marginBottom: 6 },
  rule: { fontSize: 11, color: COLORS.text3, marginBottom: 3 },
  ruleMet: { color: COLORS.green },
  saveBtn: { backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  saveBtnText: { color: COLORS.navyDark, fontSize: 15, fontWeight: '700' },
  logoutCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.redBg, borderWidth: 1, borderColor: '#FECACA', borderRadius: 14, padding: 16 },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.red },
});
