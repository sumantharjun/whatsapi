export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #e2e8f0',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'app-spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
