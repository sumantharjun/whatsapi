import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

const HEALTH_ICON = { ok: '✅', warning: '⚠️', fail: '❌' };

export default function AdminNumbers() {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ number: '', provider: '', vpnHost: '', vpnPort: '', vpnUser: '', vpnPassword: '' });
  const [actionLoading, setActionLoading] = useState({}); // { [id]: 'unblock' | 'provision' }
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const load = () =>
    api.numbers.list()
      .then((r) => setNumbers(r.numbers || []))
      .catch(() => setNumbers([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    load();
  }, [user, authLoading, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.numbers.create(form);
      setForm({ number: '', provider: '', vpnHost: '', vpnPort: '', vpnUser: '', vpnPassword: '' });
      setShowForm(false);
      await load();
      toast.success('Virtual number added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUnblock = async (n) => {
    setActionLoading((s) => ({ ...s, [n._id]: 'unblock' }));
    try {
      await api.numbers.unblock(n._id);
      await load();
      toast.success(`${n.number} unblocked`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((s) => ({ ...s, [n._id]: null }));
    }
  };

  const handleProvision = async (n) => {
    setActionLoading((s) => ({ ...s, [n._id]: 'provision' }));
    try {
      const r = await api.numbers.provisionWhatsApp(n._id);
      await load();
      toast.success(r.message || 'WhatsApp session created. Scan QR in the WhatsApp Accounts panel.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((s) => ({ ...s, [n._id]: null }));
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  const blocked = numbers.filter((n) => n.status === 'blocked').length;
  const active = numbers.filter((n) => n.status === 'active').length;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Virtual Numbers</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage numbers, VPN config, WhatsApp provisioning, and block status</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition"
        >
          {showForm ? 'Cancel' : '+ Add Number'}
        </button>
      </div>

      {/* Summary stats */}
      {numbers.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{active}</div>
            <div style={{ fontSize: 12, color: '#15803d' }}>Active</div>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{blocked}</div>
            <div style={{ fontSize: 12, color: '#b91c1c' }}>Blocked</div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{numbers.filter((n) => n.hasWhatsApp).length}</div>
            <div style={{ fontSize: 12, color: '#1d4ed8' }}>With WhatsApp</div>
          </div>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 18px', minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ea580c' }}>{numbers.filter((n) => !n.hasWhatsApp).length}</div>
            <div style={{ fontSize: 12, color: '#c2410c' }}>No WhatsApp</div>
          </div>
        </div>
      )}

      {/* Blocked numbers alert */}
      {blocked > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🚫</span>
          <div>
            <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: 14 }}>{blocked} number{blocked > 1 ? 's are' : ' is'} blocked.</span>
            <span style={{ fontSize: 13, color: '#dc2626', marginLeft: 6 }}>Campaigns using these numbers are auto-paused. Unblock them below to resume sending.</span>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 space-y-4 max-w-lg shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Add Virtual Number</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (e.g. +919876543210)</label>
            <input placeholder="+91..." value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
            <input placeholder="e.g. Twilio, TextLocal" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VPN Host</label>
              <input placeholder="proxy.example.com" value={form.vpnHost} onChange={(e) => setForm({ ...form, vpnHost: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VPN Port</label>
              <input type="number" placeholder="8080" value={form.vpnPort} onChange={(e) => setForm({ ...form, vpnPort: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">VPN Credentials</label>
            <div className="flex gap-2">
              <input placeholder="Username" value={form.vpnUser} onChange={(e) => setForm({ ...form, vpnUser: e.target.value })} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
              <input type="password" placeholder="Password" value={form.vpnPassword} onChange={(e) => setForm({ ...form, vpnPassword: e.target.value })} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">Add Number</button>
        </form>
      )}

      {loading ? <LoadingSpinner /> : numbers.length === 0 ? <EmptyState message="No virtual numbers yet. Add your first number above." /> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ minWidth: 900 }}>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Health</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Failures</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Msgs Today</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">VPN Host</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {numbers.map((n) => (
                  <tr key={n._id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${n.status === 'blocked' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-sm">{n.number}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{n.provider || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={n.status} />
                      {n.status === 'blocked' && n.blockedAt && (
                        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>
                          {new Date(n.blockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 16 }}>{HEALTH_ICON[n.health] || '—'}</span>
                      {n.status === 'blocked' && n.blockReason && (
                        <div style={{ fontSize: 10, color: '#94a3b8', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={n.blockReason}>
                          {n.blockReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {n.hasWhatsApp
                        ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Active</span>
                        : <span style={{ color: '#ea580c', fontWeight: 600 }}>⚠ Not provisioned</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span style={{
                        fontWeight: 700,
                        color: (n.consecutiveFailures || 0) >= 3 ? '#ef4444' : '#64748b'
                      }}>
                        {n.consecutiveFailures || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">{n.messagesToday || 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{n.vpnHost || '—'}</td>
                    <td className="px-4 py-3">
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Unblock button */}
                        {n.status === 'blocked' && (
                          <button
                            type="button"
                            onClick={() => handleUnblock(n)}
                            disabled={!!actionLoading[n._id]}
                            style={{ fontSize: 12, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            {actionLoading[n._id] === 'unblock' ? '…' : '🔓 Unblock'}
                          </button>
                        )}
                        {/* Provision WhatsApp button */}
                        {!n.hasWhatsApp && n.status !== 'blocked' && (
                          <button
                            type="button"
                            onClick={() => handleProvision(n)}
                            disabled={!!actionLoading[n._id]}
                            style={{ fontSize: 12, padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            {actionLoading[n._id] === 'provision' ? '…' : '📱 Setup WA'}
                          </button>
                        )}
                        {/* Already has WhatsApp but can re-provision */}
                        {n.hasWhatsApp && n.whatsappClientId && (
                          <span style={{ fontSize: 11, color: '#94a3b8', padding: '4px 6px', fontFamily: 'monospace' }} title="WhatsApp Client ID">
                            {n.whatsappClientId.slice(0, 12)}…
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
