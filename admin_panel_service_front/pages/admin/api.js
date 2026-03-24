import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

const API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api' : '';

const endpoints = [
  { method: 'GET', path: '/campaigns', desc: 'List campaigns' },
  { method: 'POST', path: '/campaigns', desc: 'Create campaign' },
  { method: 'GET', path: '/campaigns/:id', desc: 'Get campaign' },
  { method: 'POST', path: '/campaigns/:id/recipients', desc: 'Add recipients' },
  { method: 'POST', path: '/campaigns/:id/start', desc: 'Start campaign' },
  { method: 'GET', path: '/campaigns/:id/export?format=csv', desc: 'Export recipients CSV' },
  { method: 'POST', path: '/campaigns/validate-numbers', desc: 'Validate phone numbers' },
  { method: 'GET', path: '/credits/history', desc: 'Credit history' },
  { method: 'POST', path: '/ai/generate-message', desc: 'Generate message with AI' },
];

export default function AdminApi() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [search, setSearch] = useState('');

  const loadKeys = () => api.apiKeys.listAll().then((r) => setKeys(r.keys || [])).catch(() => setKeys([]));

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    loadKeys().finally(() => setLoadingKeys(false));
  }, [user, authLoading, router]);

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      await api.apiKeys.revokeAdmin(id);
      await loadKeys();
      toast.success('API key revoked');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRevoking(null);
    }
  };

  if (authLoading || !user) return null;

  const filtered = keys.filter((k) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${k.userId?.email || ''} ${k.name} ${k.keyPrefix}`.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-display)' }}>API Center</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 0' }}>Manage user API keys and view documentation</p>
        </div>
        <div style={{ color: 'var(--muted-2)', fontSize: 13 }}>Version 1.0</div>
      </div>

      {/* API Keys section */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            All API Keys
            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>({keys.length} total)</span>
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user / key name…"
            style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 12px', fontSize: 13, width: 240 }}
          />
        </div>

        {loadingKeys ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState message="No API keys found." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Key Name</th>
                  <th>Key Prefix</th>
                  <th>Created</th>
                  <th>Last Used</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k, i) => (
                  <tr key={k._id}>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{k.userId?.email || '—'}</td>
                    <td style={{ fontSize: 13 }}>{k.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{k.keyPrefix}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <button
                        type="button"
                        disabled={revoking === k._id}
                        onClick={() => handleRevoke(k._id)}
                        style={{ fontSize: 12, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                      >
                        {revoking === k._id ? '…' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Docs section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 20 }}>
        <div className="card card-pad">
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text)' }}>Base URL</h2>
          <div style={{ background: '#f1f5f9', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {API_BASE}
          </div>
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>Auth Header</h3>
            <div style={{ background: '#0f172a', color: '#86efac', borderRadius: 10, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace' }}>
              Authorization: Bearer &lt;api-key&gt;
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              Users generate API keys in <strong>Client → API</strong> page.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-pad" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Endpoints</h2>
          </div>
          <div style={{ padding: '0 16px 12px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Endpoint</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((e) => (
                  <tr key={`${e.method}-${e.path}`}>
                    <td style={{ fontWeight: 700, color: e.method === 'GET' ? '#0891b2' : '#7c3aed', fontSize: 12 }}>{e.method}</td>
                    <td style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: 12 }}>{e.path}</td>
                    <td style={{ fontSize: 13 }}>{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
