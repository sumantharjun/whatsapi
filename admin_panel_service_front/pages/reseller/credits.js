import { useEffect, useState } from 'react';
import ResellerLayout from '../../components/ResellerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

export default function ResellerCredits() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetUserId, setTargetUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, loading: authLoading, refresh } = useAuth();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'reseller')) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.users.list({ role: 'client' })
      .then((r) => setUsers(r.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const onGrant = async (e) => {
    e.preventDefault();
    if (!targetUserId || !amount || parseInt(amount, 10) <= 0) return;
    setSubmitting(true);
    try {
      await api.credits.purchase(targetUserId, parseInt(amount, 10));
      setTargetUserId('');
      setAmount('');
      await refresh();
      const r = await api.users.list({ role: 'client' });
      setUsers(r.users || []);
      toast.success('Credits granted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  const creditCards = [
    { key: 'normal', label: 'Normal Credit', balanceKey: 'creditBalance', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    { key: 'r_btn', label: 'R-Btn Credit', balanceKey: 'rBtnCredit', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { key: 'action_btn', label: 'Action Btn Credit', balanceKey: 'actionBtnCredit', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
    { key: 'btn_sms', label: 'Btn-SMS Credit', balanceKey: 'btnSmsCredit', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ];

  return (
    <ResellerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Credits</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your balance and credit management</p>
      </div>

      {/* Credit balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, marginBottom: 32 }}>
        {creditCards.map((ct) => (
          <div key={ct.key} style={{ background: ct.bg, border: `1.5px solid ${ct.border}`, borderRadius: 14, padding: '20px 20px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: ct.color, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ct.label}</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', margin: '4px 0 2px', lineHeight: 1.1 }}>{user[ct.balanceKey] ?? 0}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Available credits</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Assign Credits to Client</h2>
        <form onSubmit={onGrant} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 max-w-lg flex flex-wrap gap-4 items-end shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 min-w-55 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          >
            <option value="">Select client</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.email} ({u.creditBalance ?? 0} credits)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-emerald-500" required />
        </div>
          <button type="submit" disabled={submitting} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-900/20">Grant</button>
        </form>
        {loading ? <LoadingSpinner /> : users.length === 0 ? <EmptyState message="No clients. Register a client first." /> : null}
      </div>
    </ResellerLayout>
  );
}
