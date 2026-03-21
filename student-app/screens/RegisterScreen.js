import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, StatusBar, ActivityIndicator
} from 'react-native';
import api from '../api/axios';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    enrollment_no: '', semester: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.enrollment_no || !form.semester) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        ...form,
        role: 'student',
        semester: parseInt(form.semester),
        department_id: 'fd1e3235-48d4-4b08-bfd4-4af05a53ff91',
      });
      navigation.navigate('FaceScan', { userId: res.data.user.id, token: res.data.token });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name',          label: 'Full Name',           placeholder: 'Enter your full name' },
    { key: 'email',         label: 'College Email',       placeholder: 'you@cdgi.ac.in', keyboard: 'email-address' },
    { key: 'password',      label: 'Password',            placeholder: 'Min 8 chars', secure: true },
    { key: 'enrollment_no', label: 'Enrollment Number',   placeholder: 'eg. 0832CS231001' },
    { key: 'semester',      label: 'Semester',            placeholder: '1 to 8', keyboard: 'numeric' },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* TOP */}
        <View style={s.topSection}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>A</Text>
          </View>
          <Text style={s.brandName}>Create Account</Text>
          <Text style={s.brandSub}>Step 1 of 2 — Basic Details</Text>
        </View>

        {/* FORM */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>Student Registration</Text>

          {fields.map(f => (
            <View key={f.key} style={s.inputWrap}>
              <Text style={s.inputLabel}>{f.label}</Text>
              {f.secure ? (
                <View style={s.passRow}>
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.text3}
                    value={form[f.key]}
                    onChangeText={v => set(f.key, v)}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
                    <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={s.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.text3}
                  value={form[f.key]}
                  onChangeText={v => set(f.key, v)}
                  keyboardType={f.keyboard || 'default'}
                  autoCapitalize="none"
                />
              )}
            </View>
          ))}

          <TouchableOpacity style={s.submitBtn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitBtnText}>Next — Face Scan »</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.link}>Already registered? Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </>
  );
}

const COLORS = {
  navy: '#2C3E6B', navyDark: '#1e2c50', gold: '#F0C040',
  bg: '#EEF1F6', white: '#fff', surface: '#F4F6F9',
  border: '#DDE1EA', text: '#1A1A1A', text2: '#4A4A4A', text3: '#9AA0AD',
};

const s = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: COLORS.bg },
  topSection: {
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    paddingTop: 56, paddingBottom: 32, paddingHorizontal: 24,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  logoCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  logoText: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  brandName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 2 },
  brandSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  formCard: {
    margin: 20, backgroundColor: COLORS.white,
    borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  formTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  inputWrap: { marginBottom: 13 },
  inputLabel: { fontSize: 12, fontWeight: '500', color: COLORS.text2, marginBottom: 5 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 8,
    padding: 11, fontSize: 14, color: COLORS.text,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 44, height: 44,
    backgroundColor: COLORS.surface, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },
  submitBtn: {
    backgroundColor: COLORS.navy, borderRadius: 8,
    padding: 13, alignItems: 'center', marginTop: 6, marginBottom: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  link: { textAlign: 'center', color: COLORS.navy, fontSize: 13, fontWeight: '500' },
});
