export default function EmptyState({ message = 'No data yet.' }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '28px' }}>
      <p style={{ color: 'var(--muted)', fontWeight: 700 }}>{message}</p>
    </div>
  );
}
