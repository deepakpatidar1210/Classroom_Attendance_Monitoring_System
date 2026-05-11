import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* TOP SECTION */}
        <View style={s.topSection}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>A</Text>
          </View>
          <Text style={s.brandName}>AttendSoft — CDGI</Text>
          <Text style={s.brandSub}>Attendance Monitoring System</Text>
          <Text style={s.collegeName}>Chameli Devi Group of Institutions</Text>
        </View>

        {/* FORM CARD */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>Student Login</Text>
          <Text style={s.formSub}>Sign in to your account</Text>

          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>College Email</Text>
            <TextInput
              style={s.input}
              placeholder="you@cdgi.ac.in"
              placeholderTextColor={COLORS.text3}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>Password</Text>
            <View style={s.passRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.text3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnText}>Login »</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.link}>New student? Register here</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  navy: '#1A3644', navyDark: '#132832', gold: '#F59E0B',
  bg: '#EEF1F6', white: '#fff', surface: '#F4F6F9',
  border: '#DDE1EA', text: '#1A1A1A', text2: '#4A4A4A', text3: '#9AA0AD',
};

const s = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: COLORS.bg },
  topSection: {
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    paddingTop: 70, paddingBottom: 40, paddingHorizontal: 24,
  },
  logoCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 22, fontWeight: '700', color: COLORS.navy },
  brandName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 2 },
  brandSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  collegeName: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  formCard: {
    margin: 20, backgroundColor: COLORS.white,
    borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  formTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  formSub: { fontSize: 12, color: COLORS.text3, marginBottom: 20 },
  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '500', color: COLORS.text2, marginBottom: 5 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 8, padding: 11,
    fontSize: 14, color: COLORS.text,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: {
    width: 44, height: 44,
    backgroundColor: COLORS.surface, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },
  loginBtn: {
    backgroundColor: COLORS.navy, borderRadius: 8,
    padding: 13, alignItems: 'center', marginTop: 6, marginBottom: 16,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  link: { textAlign: 'center', color: COLORS.navy, fontSize: 13, fontWeight: '500' },
});
