import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../api/axios';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    enrollment_no: '', semester: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        ...form,
        role: 'student',
        semester: parseInt(form.semester),
        department_id: 'fd1e3235-48d4-4b08-bfd4-4af05a53ff91',
      });
      // Registration ke baad face scan pe bhejo
      navigation.navigate('FaceScan', { userId: res.data.user.id, token: res.data.token });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.title}>Create account</Text>
      <Text style={s.sub}>Step 1 of 2 — Basic details</Text>

      {[
        { key: 'name', placeholder: 'Full name' },
        { key: 'email', placeholder: 'College email', keyboard: 'email-address' },
        { key: 'password', placeholder: 'Password', secure: true },
        { key: 'enrollment_no', placeholder: 'Enrollment no. (0832CS231011)' },
        { key: 'semester', placeholder: 'Semester (1-8)', keyboard: 'numeric' },
      ].map(field => (
        <TextInput
          key={field.key}
          style={s.input}
          placeholder={field.placeholder}
          placeholderTextColor="#aaa"
          value={form[field.key]}
          onChangeText={val => set(field.key, val)}
          secureTextEntry={field.secure}
          keyboardType={field.keyboard || 'default'}
          autoCapitalize="none"
        />
      ))}

      <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Registering...' : 'Next — Face Scan'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={s.link}>Already registered? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 28, backgroundColor: '#f7f6f3', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: '#111', marginBottom: 4 },
  sub: { fontSize: 13, color: '#888', marginBottom: 28 },
  input: { backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, color: '#111', marginBottom: 12 },
  btn: { backgroundColor: '#111', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  link: { textAlign: 'center', marginTop: 18, color: '#888', fontSize: 13 },
});