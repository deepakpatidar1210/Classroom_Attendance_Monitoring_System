import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FACE_SERVER_URL } from '../config';

const ANGLES = ['Front', 'Slightly left', 'Slightly right'];

export default function FaceScanScreen({ route, navigation }) {
  const { userId, token } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [currentAngle, setCurrentAngle] = useState(0);
  const [captured, setCaptured] = useState([]);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef(null);

  // Fixed: permission dependency add ki
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  const captureAngle = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      const newCaptured = [...captured, photo.base64];
      setCaptured(newCaptured);

      if (currentAngle < ANGLES.length - 1) {
        setCurrentAngle(currentAngle + 1);
      } else {
        await saveFaceData(newCaptured, token);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not capture photo');
    }
  };

  const saveFaceData = async (images, token) => {
    setSaving(true);
    try {
      await AsyncStorage.setItem('token', token);

      const descriptors = [];
      for (const imageBase64 of images) {
        // Fixed: FACE_SERVER_URL config se aa raha hai
        const res = await axios.post(`${FACE_SERVER_URL}/get-descriptor`, {
          image: imageBase64,
        });
        if (res.data.descriptor) {
          descriptors.push(res.data.descriptor);
        }
      }

      if (descriptors.length === 0) {
        Alert.alert('Error', 'No face detected in photos. Try again.');
        setSaving(false);
        return;
      }

      await api.post('/auth/save-face', {
        userId,
        faceImages: descriptors,
      });

      Alert.alert('Success!', 'Face registered!', [
        { text: 'Go to Login', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not save face data. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={s.wrap}>
        <Text style={s.title}>Camera permission needed</Text>
        <TouchableOpacity style={s.btn} onPress={requestPermission}>
          <Text style={s.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Face Registration</Text>
      <Text style={s.sub}>Step 2 of 2 — {ANGLES[currentAngle]} ({currentAngle + 1}/{ANGLES.length})</Text>

      <View style={s.cameraWrap}>
        <CameraView ref={cameraRef} style={s.camera} facing="front" />
        <View style={s.overlay}>
          <View style={s.faceGuide} />
        </View>
      </View>

      <View style={s.dots}>
        {ANGLES.map((_, i) => (
          <View key={i} style={[s.dot, i < captured.length && s.dotFilled, i === currentAngle && s.dotActive]} />
        ))}
      </View>

      <Text style={s.instruction}>
        {saving ? 'Saving...' : `Look ${ANGLES[currentAngle].toLowerCase()} and tap capture`}
      </Text>

      <TouchableOpacity style={s.btn} onPress={captureAngle} disabled={saving}>
        <Text style={s.btnText}>{saving ? 'Saving...' : 'Capture'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#111', padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: '#888', marginBottom: 24 },
  cameraWrap: { width: 280, height: 340, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  camera: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  faceGuide: { width: 200, height: 240, borderRadius: 100, borderWidth: 2, borderColor: '#5DCAA5', borderStyle: 'dashed' },
  dots: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333' },
  dotFilled: { backgroundColor: '#5DCAA5' },
  dotActive: { backgroundColor: '#fff' },
  instruction: { fontSize: 13, color: '#888', marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 48, alignItems: 'center' },
  btnText: { color: '#111', fontSize: 15, fontWeight: '500' },
});
