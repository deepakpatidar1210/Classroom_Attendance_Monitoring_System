import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MarkAttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState('qr');
  const [session, setSession] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [faceStatus, setFaceStatus] = useState('idle');
  const cameraRef = useRef(null);

  // Fixed: permission dependency add ki
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const handleQRScan = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const res = await api.post('/qr/validate', { token: data });
      setSession(res.data.session);
      setStep('gps');
    } catch (err) {
      Alert.alert('Invalid QR', 'QR expired ya invalid hai.', [
        { text: 'Try again', onPress: () => setScanned(false) }
      ]);
    }
  };

  const submitAttendance = async () => {
    try {
      await api.post('/attendance/mark', {
        session_id: session.id,
        qr_verified: true,
        gps_verified: true,
        face_verified: true,
      });
      setStep('done');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not mark attendance');
    }
  };

  const captureFace = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }
    try {
      setFaceStatus('capturing');
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      setFaceStatus('matching');

      const res = await api.post('/auth/verify-face', {
        userId: user.id,
        capturedImage: photo.base64,
      });

      if (res.data.verified) {
        setFaceStatus('success');
        setTimeout(async () => {
          await submitAttendance();
        }, 1500);
      } else {
        setFaceStatus('failed');
        setTimeout(() => setFaceStatus('idle'), 2000);
      }
    } catch (err) {
      setFaceStatus('failed');
      setTimeout(() => setFaceStatus('idle'), 2000);
      Alert.alert('Error', err.response?.data?.error || err.message);
    }
  };

  if (step === 'done') {
    return (
      <ScrollView contentContainerStyle={s.doneWrap}>
        <View style={s.successIcon}>
          <Text style={{ fontSize: 32, color: '#fff' }}>✓</Text>
        </View>
        <Text style={s.successTitle}>Attendance marked!</Text>
        <Text style={s.successSub}>Present marked successfully</Text>
        <TouchableOpacity style={s.whiteBtn} onPress={() => navigation.navigate('Dashboard')} activeOpacity={0.7}>
          <Text style={s.whiteBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const StepIndicator = ({ currentStep }) => {
    const steps = ['qr', 'gps', 'face'];
    const labels = ['QR Scan', 'GPS', 'Face'];
    return (
      <View style={s.steps}>
        {labels.map((label, i) => {
          const done = steps.indexOf(currentStep) > i;
          const active = steps[i] === currentStep;
          return (
            <View key={label} style={s.stepItem}>
              <View style={[s.stepDot, done && s.stepDone, active && s.stepActive]}>
                <Text style={s.stepNum}>{done ? '✓' : i + 1}</Text>
              </View>
              <Text style={[s.stepLabel, active && s.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (step === 'qr') {
    return (
      <View style={s.wrap}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <StepIndicator currentStep="qr" />
        <View style={s.cameraWrap}>
          <CameraView
            style={s.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleQRScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={s.scanOverlay}>
            <View style={s.scanBox} />
          </View>
          <Text style={s.cameraLabel}>Scan the QR Code</Text>
        </View>
      </View>
    );
  }

  if (step === 'gps') {
    return (
      <ScrollView contentContainerStyle={s.scrollWrap}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <StepIndicator currentStep="gps" />
        <Text style={s.stepTitle}>GPS Step</Text>
        <Text style={s.stepDesc}>Testing mode — continue</Text>
        <TouchableOpacity style={s.whiteBtn} onPress={() => setStep('face')} activeOpacity={0.7}>
          <Text style={s.whiteBtnText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'face') {
    return (
      <View style={s.wrap}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <StepIndicator currentStep="face" />
        <View style={s.cameraWrap}>
          <CameraView ref={cameraRef} style={s.camera} facing="front" />
          <View style={s.scanOverlay}>
            <View style={s.faceGuide} />
          </View>

          {faceStatus === 'matching' && (
            <View style={s.matchingOverlay}>
              <View style={s.matchingBox}>
                <ActivityIndicator size="large" color="#5DCAA5" />
                <Text style={s.matchingText}>Face Matching...</Text>
                <Text style={s.matchingSubText}>Please wait</Text>
              </View>
            </View>
          )}

          {faceStatus === 'success' && (
            <View style={s.matchingOverlay}>
              <View style={[s.matchingBox, { backgroundColor: '#0F6E56' }]}>
                <Text style={{ fontSize: 48, color: '#fff' }}>✓</Text>
                <Text style={s.matchingText}>Face Matched!</Text>
                <Text style={[s.matchingSubText, { color: '#9FE1CB' }]}>Attendance marking...</Text>
              </View>
            </View>
          )}

          {faceStatus === 'failed' && (
            <View style={s.matchingOverlay}>
              <View style={[s.matchingBox, { backgroundColor: '#7F1D1D' }]}>
                <Text style={{ fontSize: 48, color: '#fff' }}>✗</Text>
                <Text style={s.matchingText}>Face Doesn't Match</Text>
                <Text style={[s.matchingSubText, { color: '#FCA5A5' }]}>Please try again</Text>
              </View>
            </View>
          )}
        </View>

        {faceStatus === 'idle' && (
          <TouchableOpacity style={s.whiteBtn} onPress={captureFace} activeOpacity={0.7}>
            <Text style={s.whiteBtnText}>Scan Face ✓</Text>
          </TouchableOpacity>
        )}

        {faceStatus === 'capturing' && (
          <View style={[s.whiteBtn, { backgroundColor: '#222' }]}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[s.whiteBtnText, { color: '#888', marginTop: 4 }]}>Photo le raha hai...</Text>
          </View>
        )}
      </View>
    );
  }
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#111', padding: 24 },
  scrollWrap: { flexGrow: 1, backgroundColor: '#111', padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 600 },
  doneWrap: { flexGrow: 1, backgroundColor: '#111', padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 600 },
  back: { alignSelf: 'flex-start', marginTop: 40, marginBottom: 20 },
  backText: { color: '#888', fontSize: 14 },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 32 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#fff' },
  stepDone: { backgroundColor: '#1D9E75' },
  stepNum: { color: '#fff', fontSize: 14, fontWeight: '600' },
  stepLabel: { fontSize: 11, color: '#555' },
  stepLabelActive: { color: '#fff' },
  cameraWrap: { flex: 1, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 20 },
  camera: { flex: 1 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: 220, height: 220, borderWidth: 2, borderColor: '#5DCAA5', borderRadius: 12 },
  faceGuide: { width: 200, height: 240, borderRadius: 120, borderWidth: 2, borderColor: '#5DCAA5', borderStyle: 'dashed' },
  cameraLabel: { position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 13 },
  matchingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.80)', alignItems: 'center', justifyContent: 'center' },
  matchingBox: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, width: '80%' },
  matchingText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  matchingSubText: { color: '#888', fontSize: 13, textAlign: 'center' },
  stepTitle: { fontSize: 24, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 12 },
  stepDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  whiteBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 48, alignItems: 'center', width: '80%', alignSelf: 'center', marginBottom: 30 },
  whiteBtnText: { color: '#111', fontSize: 16, fontWeight: '600' },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 26, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 40 },
});
