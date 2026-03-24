import { useEffect, useState } from 'react';
import ResellerLayout from '../../components/ResellerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

const API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') : '';

export default function ResellerAPI() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const loadKeys = () => api.apiKeys.list().then((r) => setKeys(r.keys || [])).catch(() => setKeys([]));

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'reseller')) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    loadKeys().finally(() => setLoadingKeys(false));
  }, [user, authLoading, router]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newKeyName.trim() || 'My API Key';
    setCreating(true);
    try {
      const res = await api.apiKeys.create(name);
      setRevealedKey({ id: res.apiKey._id, key: res.rawKey });
      setNewKeyName('');
      await loadKeys();
      toast.success('API key created. Copy it now — it will not be shown again.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      await api.apiKeys.revoke(id);
      if (revealedKey?.id === id) setRevealedKey(null);
      await loadKeys();
      toast.success('API key revoked');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRevoking(null);
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <ResellerLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">API</h1>
      <p className="text-slate-500 text-sm mb-6">Generate API keys and use the API programmatically.</p>

      {/* Create key */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 max-w-lg">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Create New API Key</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10 }}>
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. My App)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button type="submit" disabled={creating}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      {/* Revealed key */}
      {revealedKey && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '16px 18px', marginBottom: 20, maxWidth: 600 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: '0 0 8px' }}>
            ✅ Key created — copy it now. It will not be shown again.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code style={{ flex: 1, background: '#fff', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 13, wordBreak: 'break-all', color: '#0f172a' }}>
              {revealedKey.key}
            </code>
            <button type="button"
              onClick={() => { navigator.clipboard.writeText(revealedKey.key); toast.success('Copied!'); }}
              style={{ padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Copy
            </button>
          </div>
          <button type="button" onClick={() => setRevealedKey(null)}
            style={{ marginTop: 10, fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Keys list */}
      <h2 className="text-base font-semibold text-slate-800 mb-3">My API Keys</h2>
      {loadingKeys ? <LoadingSpinner /> : keys.length === 0 ? (
        <p className="text-slate-500 text-sm mb-6">No API keys yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Key (prefix)</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Used</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-800 text-sm">{k.name}</td>
                  <td className="px-5 py-3 font-mono text-slate-600 text-sm">{k.keyPrefix}</td>
                  <td className="px-5 py-3 text-slate-500 text-sm">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate-500 text-sm">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <button type="button" disabled={revoking === k._id}
                      onClick={() => handleRevoke(k._id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50">
                      {revoking === k._id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Docs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">API Reference</h2>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Base URL</label>
          <code className="block bg-slate-100 px-3 py-2 rounded text-sm text-slate-800">{API_BASE}</code>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Authentication</label>
          <code className="block bg-slate-900 text-green-400 px-3 py-2 rounded text-sm">
            Authorization: Bearer {'<your-api-key>'}
          </code>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Endpoints</label>
          <ul className="text-sm text-slate-600 space-y-1">
            {[
              ['GET', '/campaigns', 'List all client campaigns'],
              ['GET', '/users?role=client', 'List your clients'],
              ['POST', '/credits/purchase', 'Grant credits to client'],
              ['GET', '/credits/history', 'Credit history'],
              ['GET', '/analytics/overview', 'Analytics overview'],
            ].map(([method, path, desc]) => (
              <li key={path} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: method === 'GET' ? '#0891b2' : '#7c3aed', minWidth: 36 }}>{method}</span>
                <code className="bg-slate-100 px-1.5 rounded text-xs text-slate-800">{path}</code>
                <span className="text-slate-500 text-xs">{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ResellerLayout>
  );
}
