import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function SubjectCard({ subject, present, total, onPress }) {
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  const pctColor = percentage >= 75 ? '#1D9E75' : percentage >= 60 ? '#EF9F27' : '#E24B4A';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.left}>
        <Text style={s.name}>{subject}</Text>
        <Text style={s.count}>{present}/{total} classes</Text>
      </View>
      <View style={s.right}>
        <Text style={[s.pct, { color: pctColor }]}>{percentage}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderColor: '#e8e6e0' },
  left: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: '#111' },
  count: { fontSize: 12, color: '#888', marginTop: 2 },
  right: { marginLeft: 12 },
  pct: { fontSize: 18, fontWeight: '600' },
});
