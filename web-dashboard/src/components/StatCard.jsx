export default function StatCard({ label, value, sub, color }) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color: color || '#111' }}>{value}</div>
      {sub && <div style={styles.sub}>{sub}</div>}
    </div>
  );
}

const styles = {
  card: { background: '#f7f6f3', borderRadius: 10, padding: '14px 16px' },
  label: { fontSize: 11, color: '#888', marginBottom: 6 },
  value: { fontSize: 24, fontWeight: 500 },
  sub: { fontSize: 11, color: '#888', marginTop: 4 },
};