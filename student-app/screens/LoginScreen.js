import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Fill all fields');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.logo}>AttendX</Text>
      <Text style={s.sub}>Student Portal</Text>

      <TextInput
        style={s.input}
        placeholder="College email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>Login</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={s.link}>New student? Register here</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#f7f6f3' },
  logo: { fontSize: 28, fontWeight: '600', color: '#111', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 32 },
  input: { backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, color: '#111', marginBottom: 14 },
  btn: { backgroundColor: '#111', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  link: { textAlign: 'center', marginTop: 20, color: '#888', fontSize: 13 },
});