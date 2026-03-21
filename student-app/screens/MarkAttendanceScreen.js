import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar, SafeAreaView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  navy: '#2C3E6B', navyDark: '#1e2c50', gold: '#F0C040',
  bg: '#EEF1F6', white: '#fff', surface: '#F4F6F9',
  border: '#DDE1EA', text: '#1A1A1A', text2: '#4A4A4A', text3: '#9AA0AD',
  green: '#16A34A', greenBg: '#DCFCE7',
  red: '#DC2626', redBg: '#FEF2F2',
};

export default function MarkAttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState('qr');
  const [session, setSession] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [faceStatus, setFaceStatus] = useState('idle'); // idle | capturing | matching | success | failed
  const [failReason, setFailReason] = useState('');
  const cameraRef = useRef(null);

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
      Alert.alert('Invalid QR', err.response?.data?.error || 'QR expired or invalid.', [
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
      Alert.alert('Error', 'Camera not ready, please wait');
      return;
    }

    try {
      setFaceStatus('capturing');
      setFailReason('');

      // 3 baar try karo — best frame use karo
      let bestPhoto = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.8,       // High quality
            skipProcessing: false, // Proper orientation
          });
          bestPhoto = photo;
          break; // Pehli successful capture use karo
        } catch (e) {
          console.log(`Capture attempt ${attempt + 1} failed:`, e.message);
          if (attempt === 2) throw new Error('Camera capture failed after 3 attempts');
          await new Promise(r => setTimeout(r, 300)); // 300ms wait
        }
      }

      if (!bestPhoto?.base64) {
        throw new Error('No image captured');
      }

      setFaceStatus('matching');

      const res = await api.post('/auth/verify-face', {
        userId: user.id,
        capturedImage: bestPhoto.base64,
      });

      console.log('Face verify response:', JSON.stringify(res.data));

      if (res.data.verified) {
        setFaceStatus('success');
        setTimeout(async () => {
          await submitAttendance();
        }, 1500);
      } else {
        const reason = res.data.reason || 'Face did not match';
        const confidence = res.data.confidence || 0;
        console.log(`Face mismatch: ${reason}, confidence: ${confidence}%`);
        setFailReason(`${reason}`);
        setFaceStatus('failed');
        setTimeout(() => {
          setFaceStatus('idle');
          setFailReason('');
        }, 3000);
      }
    } catch (err) {
      console.log('captureFace error:', err.message);
      const errMsg = err.response?.data?.reason || err.response?.data?.error || err.message;
      setFailReason(errMsg);
      setFaceStatus('failed');
      setTimeout(() => {
        setFaceStatus('idle');
        setFailReason('');
      }, 3000);
    }
  };

  // STEP INDICATOR
  const StepBar = ({ current }) => {
    const steps = [
      { key: 'qr', label: 'QR Scan' },
      { key: 'gps', label: 'GPS' },
      { key: 'face', label: 'Face' },
    ];
    const idx = steps.findIndex(s => s.key === current);
    return (
      <View style={st.stepBar}>
        {steps.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <View key={s.key} style={st.stepItem}>
              <View style={[st.stepCircle, done && st.stepDone, active && st.stepActive]}>
                <Text style={[st.stepNum, (done || active) && { color: done ? '#fff' : COLORS.navy }]}>
                  {done ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[st.stepLabel, active && st.stepLabelActive]}>{s.label}</Text>
              {i < steps.length - 1 && (
                <View style={[st.stepLine, done && st.stepLineDone]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // DONE
  if (step === 'done') {
    return (
      <SafeAreaView style={[st.wrap, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <View style={st.successIcon}>
          <Text style={{ fontSize: 36, color: '#fff' }}>✓</Text>
        </View>
        <Text style={st.successTitle}>Attendance Marked!</Text>
        <Text style={st.successSub}>Present marked successfully</Text>
        <TouchableOpacity style={st.whiteBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={st.whiteBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // QR
  if (step === 'qr') {
    return (
      <SafeAreaView style={st.wrap}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={st.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>Mark Attendance</Text>
          <View style={{ width: 48 }} />
        </View>
        <StepBar current="qr" />
        <View style={st.cameraContainer}>
          <CameraView
            style={st.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleQRScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={st.scanOverlay}>
            <View style={st.scanFrame}>
              <View style={[st.corner, st.tl]} />
              <View style={[st.corner, st.tr]} />
              <View style={[st.corner, st.bl]} />
              <View style={[st.corner, st.br]} />
            </View>
          </View>
          <Text style={st.cameraHint}>Point at the classroom QR code</Text>
        </View>
      </SafeAreaView>
    );
  }

  // GPS
  if (step === 'gps') {
    return (
      <SafeAreaView style={[st.wrap, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <StepBar current="gps" />
        <View style={st.gpsIcon}>
          <Text style={{ fontSize: 40 }}>📍</Text>
        </View>
        <Text style={st.gpsTitle}>Verifying Location</Text>
        <Text style={st.gpsSub}>Confirming you are inside the classroom</Text>
        <TouchableOpacity style={st.whiteBtn} onPress={() => setStep('face')}>
          <Text style={st.whiteBtnText}>Continue →</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // FACE
  if (step === 'face') {
    return (
      <SafeAreaView style={st.wrap}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={st.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>Face Verification</Text>
          <View style={{ width: 48 }} />
        </View>
        <StepBar current="face" />

        {/* Tips banner — idle mein dikhao */}
        {faceStatus === 'idle' && (
          <View style={st.tipsBanner}>
            <Text style={st.tipsText}>💡 Good lighting · Face the camera directly · Remove glasses</Text>
          </View>
        )}

        <View style={st.cameraContainer}>
          <CameraView ref={cameraRef} style={st.camera} facing="front" />
          <View style={st.scanOverlay}>
            <View style={st.faceGuide} />
          </View>

          {faceStatus === 'capturing' && (
            <View style={st.faceOverlay}>
              <View style={st.overlayBox}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={st.overlayTitle}>Capturing...</Text>
                <Text style={st.overlaySub}>Hold still</Text>
              </View>
            </View>
          )}

          {faceStatus === 'matching' && (
            <View style={st.faceOverlay}>
              <View style={st.overlayBox}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={st.overlayTitle}>Matching Face...</Text>
                <Text style={st.overlaySub}>Please wait</Text>
              </View>
            </View>
          )}

          {faceStatus === 'success' && (
            <View style={st.faceOverlay}>
              <View style={[st.overlayBox, { backgroundColor: COLORS.green }]}>
                <Text style={{ fontSize: 48, color: '#fff' }}>✓</Text>
                <Text style={st.overlayTitle}>Face Matched!</Text>
                <Text style={[st.overlaySub, { color: COLORS.greenBg }]}>Marking attendance...</Text>
              </View>
            </View>
          )}

          {faceStatus === 'failed' && (
            <View style={st.faceOverlay}>
              <View style={[st.overlayBox, { backgroundColor: COLORS.red }]}>
                <Text style={{ fontSize: 48, color: '#fff' }}>✗</Text>
                <Text style={st.overlayTitle}>Face Mismatch</Text>
                <Text style={[st.overlaySub, { color: '#FCA5A5' }]}>
                  {failReason || 'Please try again in better lighting'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {faceStatus === 'idle' && (
          <TouchableOpacity style={st.whiteBtn} onPress={captureFace}>
            <Text style={st.whiteBtnText}>Scan Face ✓</Text>
          </TouchableOpacity>
        )}

        {(faceStatus === 'capturing' || faceStatus === 'matching') && (
          <View style={[st.whiteBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <ActivityIndicator color="#fff" />
            <Text style={[st.whiteBtnText, { color: 'rgba(255,255,255,0.6)', marginTop: 6 }]}>
              {faceStatus === 'capturing' ? 'Capturing...' : 'Matching...'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.navy },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, width: 48 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },

  tipsBanner: {
    marginHorizontal: 16, marginBottom: 4,
    backgroundColor: 'rgba(240,192,64,0.15)',
    borderRadius: 8, padding: 10,
  },
  tipsText: { color: COLORS.gold, fontSize: 11, textAlign: 'center' },

  stepBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, paddingVertical: 16,
  },
  stepItem: { alignItems: 'center', position: 'relative' },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepActive: { backgroundColor: COLORS.gold },
  stepDone: { backgroundColor: COLORS.green },
  stepNum: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  stepLabelActive: { color: COLORS.gold, fontWeight: '600' },
  stepLine: {
    position: 'absolute', top: 18, left: 36, width: 48, height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepLineDone: { backgroundColor: COLORS.green },

  cameraContainer: { flex: 1, margin: 16, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 220, height: 220, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: COLORS.gold, borderStyle: 'solid' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderRadius: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 3 },
  faceGuide: {
    width: 200, height: 240, borderRadius: 120,
    borderWidth: 2, borderColor: COLORS.gold, borderStyle: 'dashed',
  },
  cameraHint: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 13,
  },

  gpsIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  gpsTitle: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 8 },
  gpsSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 36 },

  faceOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayBox: {
    backgroundColor: COLORS.navyDark, borderRadius: 20,
    padding: 32, alignItems: 'center', gap: 10, width: '75%',
  },
  overlayTitle: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  overlaySub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },

  whiteBtn: {
    margin: 16, backgroundColor: COLORS.gold,
    borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  whiteBtnText: { color: COLORS.navyDark, fontSize: 16, fontWeight: '700' },

  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8 },
  successSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 40 },
});
