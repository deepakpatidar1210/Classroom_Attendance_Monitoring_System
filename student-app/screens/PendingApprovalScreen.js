import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView } from 'react-native';

const COLORS = {
  navy: '#1A3644', navyDark: '#132832', gold: '#F59E0B',
  bg: '#EEF1F6', white: '#fff',
};

export default function PendingApprovalScreen({ navigation }) {
  return (
    <SafeAreaView style={s.wrap}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={s.content}>
        {/* Icon */}
        <View style={s.iconCircle}>
          <Text style={{ fontSize: 48 }}>⏳</Text>
        </View>

        <Text style={s.title}>Registration Submitted!</Text>
        <Text style={s.sub}>Your request has been sent to the admin for approval.</Text>

        {/* Steps */}
        <View style={s.stepsCard}>
          <Text style={s.stepsTitle}>What happens next?</Text>

          <View style={s.step}>
            <View style={[s.stepDot, { backgroundColor: COLORS.gold }]}>
              <Text style={s.stepNum}>1</Text>
            </View>
            <Text style={s.stepText}>Admin will review your registration request</Text>
          </View>

          <View style={s.step}>
            <View style={[s.stepDot, { backgroundColor: COLORS.gold }]}>
              <Text style={s.stepNum}>2</Text>
            </View>
            <Text style={s.stepText}>Your face photo will be verified by admin</Text>
          </View>

          <View style={s.step}>
            <View style={[s.stepDot, { backgroundColor: '#16A34A' }]}>
              <Text style={s.stepNum}>3</Text>
            </View>
            <Text style={s.stepText}>Once approved, you can login with your credentials</Text>
          </View>
        </View>

        <View style={s.noteCard}>
          <Text style={s.noteText}>
            📧 You will be notified once your account is approved. This usually takes a few hours.
          </Text>
        </View>

        <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={s.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.navy },
  content: {
    flex: 1, padding: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 10, textAlign: 'center' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 32, lineHeight: 22 },

  stepsCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 20, marginBottom: 16,
  },
  stepsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.gold, marginBottom: 16 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNum: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  stepText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1, lineHeight: 20 },

  noteCard: {
    width: '100%', backgroundColor: 'rgba(240,192,64,0.15)',
    borderRadius: 10, padding: 14, marginBottom: 28,
    borderWidth: 1, borderColor: 'rgba(240,192,64,0.3)',
  },
  noteText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 20, textAlign: 'center' },

  loginBtn: {
    width: '100%', backgroundColor: COLORS.gold,
    borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  loginBtnText: { color: COLORS.navyDark, fontSize: 16, fontWeight: '700' },
});
