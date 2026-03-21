import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, StatusBar, SafeAreaView, Animated, Easing
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FACE_SERVER_URL } from '../config';

const COLORS = {
  navy: '#2C3E6B', navyDark: '#1e2c50', gold: '#F0C040',
  bg: '#EEF1F6', white: '#fff', text3: '#9AA0AD',
  green: '#16A34A', greenBg: '#DCFCE7', red: '#DC2626',
};

const TOTAL_CAPTURES = 10; // Zyada captures = better descriptors

export default function FaceScanScreen({ route, navigation }) {
  const { userId, token } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState('scanning'); // scanning | saving | done | error
  const [captureCount, setCaptureCount] = useState(0);
  const [message, setMessage] = useState('Position your face in the circle');
  const cameraRef = useRef(null);
  const capturedImages = useRef([]);
  const isCapturing = useRef(false);
  const intervalRef = useRef(null);

  const progress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Auto-capture every 700ms
  useEffect(() => {
    if (phase !== 'scanning' || !permission?.granted) return;

    intervalRef.current = setInterval(async () => {
      if (isCapturing.current) return;
      if (capturedImages.current.length >= TOTAL_CAPTURES) {
        clearInterval(intervalRef.current);
        await saveAllFaces();
        return;
      }

      isCapturing.current = true;
      try {
        if (!cameraRef.current) return;

        // Quality 0.7 rakho taaki face detail achhi mile
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
          skipProcessing: false, // false = proper orientation fix
        });

        capturedImages.current.push(photo.base64);
        const newCount = capturedImages.current.length;
        setCaptureCount(newCount);

        Animated.timing(progress, {
          toValue: newCount / TOTAL_CAPTURES,
          duration: 300,
          useNativeDriver: false,
        }).start();

        if (newCount === 1) setMessage('Hold still...');
        else if (newCount === 3) setMessage('Slightly tilt left...');
        else if (newCount === 5) setMessage('Slightly tilt right...');
        else if (newCount === 7) setMessage('Look slightly up...');
        else if (newCount === 9) setMessage('Almost done...');

      } catch (e) {
        console.log('capture error', e);
      } finally {
        isCapturing.current = false;
      }
    }, 700);

    return () => clearInterval(intervalRef.current);
  }, [phase, permission]);

  const saveAllFaces = async () => {
    clearInterval(intervalRef.current);
    setPhase('saving');
    setMessage('Processing face data...');

    try {
      // Token pehle save karo
      await AsyncStorage.setItem('token', token);

      const descriptors = [];
      const errors = [];

      for (let i = 0; i < capturedImages.current.length; i++) {
        const imageBase64 = capturedImages.current[i];
        try {
          const res = await axios.post(`${FACE_SERVER_URL}/get-descriptor`, {
            image: imageBase64,
          }, { timeout: 15000 }); // 15s timeout

          if (res.data.descriptor) {
            descriptors.push(res.data.descriptor);
            console.log(`✓ Descriptor ${descriptors.length} extracted`);
          }
        } catch (e) {
          const errMsg = e.response?.data?.error || e.message;
          errors.push(`Frame ${i + 1}: ${errMsg}`);
          console.log(`✗ Frame ${i + 1} failed:`, errMsg);
        }
      }

      console.log(`Total descriptors: ${descriptors.length}/${capturedImages.current.length}`);

      // Minimum 2 descriptors chahiye (pehle 3 tha, ab 2 kar diya)
      if (descriptors.length < 2) {
        setPhase('error');
        setMessage(`Face not detected clearly. Got ${descriptors.length}/${capturedImages.current.length} frames. Try better lighting.`);
        console.log('Errors:', errors);
        return;
      }

      // Descriptors backend mein save karo
      await api.post('/auth/save-face', {
        userId,
        faceImages: descriptors,
      });

      setPhase('done');
      setMessage(`Face registered! (${descriptors.length} samples saved)`);

      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);

    } catch (err) {
      console.log('saveAllFaces error:', err.message);
      setPhase('error');
      setMessage('Registration failed. Check connection and try again.');
    }
  };

  const retry = () => {
    capturedImages.current = [];
    setCaptureCount(0);
    progress.setValue(0);
    setPhase('scanning');
    setMessage('Position your face in the circle');
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={[s.wrap, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={s.title}>Camera Permission Needed</Text>
        <TouchableOpacity style={s.goldBtn} onPress={requestPermission}>
          <Text style={s.goldBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const ringColor = phase === 'done' ? COLORS.green
    : phase === 'error' ? COLORS.red
    : COLORS.gold;

  return (
    <SafeAreaView style={s.wrap}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={s.header}>
        <Text style={s.title}>Face Registration</Text>
        <Text style={s.sub}>Step 2 of 2</Text>
      </View>

      <View style={s.cameraSection}>
        <Animated.View style={[s.ringOuter, { borderColor: ringColor, transform: [{ scale: pulseAnim }] }]}>
          <View style={s.cameraWrap}>
            <CameraView
              ref={cameraRef}
              style={s.camera}
              facing="front"
            />
            {phase === 'done' && (
              <View style={[s.overlay, { backgroundColor: 'rgba(16,185,129,0.85)' }]}>
                <Text style={{ fontSize: 56, color: '#fff' }}>✓</Text>
              </View>
            )}
            {phase === 'error' && (
              <View style={[s.overlay, { backgroundColor: 'rgba(220,38,38,0.85)' }]}>
                <Text style={{ fontSize: 56, color: '#fff' }}>✗</Text>
              </View>
            )}
            {phase === 'saving' && (
              <View style={[s.overlay, { backgroundColor: 'rgba(44,62,107,0.85)' }]}>
                <Text style={{ fontSize: 36 }}>⏳</Text>
                <Text style={{ color: '#fff', fontSize: 14, marginTop: 10, fontWeight: '600' }}>Processing...</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      <View style={s.progressSection}>
        <View style={s.progressBg}>
          <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: ringColor }]} />
        </View>
        <Text style={s.progressText}>
          {phase === 'done' ? 'Done!' : phase === 'error' ? 'Failed' : `${captureCount}/${TOTAL_CAPTURES}`}
        </Text>
      </View>

      <Text style={s.message}>{message}</Text>

      {phase === 'scanning' && (
        <View style={s.tipsCard}>
          <Text style={s.tipsTitle}>Tips for better recognition</Text>
          <Text style={s.tip}>• Bright light on your face (not behind you)</Text>
          <Text style={s.tip}>• Remove glasses if possible</Text>
          <Text style={s.tip}>• Look directly at camera first</Text>
          <Text style={s.tip}>• Slightly move head left, right & up</Text>
        </View>
      )}

      {phase === 'error' && (
        <TouchableOpacity style={s.goldBtn} onPress={retry}>
          <Text style={s.goldBtnText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.navy, padding: 24 },
  header: { alignItems: 'center', paddingTop: 8, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  cameraSection: { alignItems: 'center', marginBottom: 28 },
  ringOuter: {
    width: 260, height: 260, borderRadius: 130,
    borderWidth: 4,
    padding: 8,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20,
    elevation: 10,
  },
  cameraWrap: { flex: 1, borderRadius: 130, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 130,
  },
  progressSection: {
    paddingHorizontal: 8, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  progressBg: {
    flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 56, textAlign: 'right' },
  message: { textAlign: 'center', fontSize: 15, fontWeight: '500', color: '#fff', marginBottom: 20 },
  tipsCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 },
  tipsTitle: { fontSize: 12, fontWeight: '600', color: COLORS.gold, marginBottom: 10 },
  tip: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 5 },
  goldBtn: {
    backgroundColor: COLORS.gold, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  goldBtnText: { color: COLORS.navyDark, fontSize: 16, fontWeight: '700' },
});
