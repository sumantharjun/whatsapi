import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const CREDIT_TYPES = [
  { key: 'normal', label: 'Normal Credit' },
  { key: 'r_btn', label: 'R-Btn Credit' },
  { key: 'action_btn', label: 'Action Btn Credit' },
  { key: 'btn_sms', label: 'Btn-SMS Credit' },
];

const STATUS_STYLE = {
  pending: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
  approved: { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
  rejected: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' },
};

export default function DemoRequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState(null);
  const [form, setForm] = useState({ creditType: 'normal', userName: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadList = () => api.demoRequests.my().then((r) => setList(r.list || [])).catch(() => setList([]));

  useEffect(() => {
    if (!authLoading && (!user || !['client', 'reseller'].includes(user.role))) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/login') : '/login');
      return;
    }
    if (!user) return;
    Promise.all([
      loadList(),
      api.demoRequests.limits().then(setLimits).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.userName.trim()) { toast.error('Please enter your name'); return; }
    if (!form.phone.trim()) { toast.error('Please enter your phone number'); return; }
    setSubmitting(true);
    try {
      await api.demoRequests.submit({ creditType: form.creditType, userName: form.userName.trim(), phone: form.phone.trim() });
      toast.success('Demo request submitted.');
      setForm({ creditType: 'normal', userName: '', phone: '' });
      await Promise.all([loadList(), api.demoRequests.limits().then(setLimits).catch(() => {})]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <ClientLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Demo Requests</h1>
      <p className="text-slate-500 text-sm mb-6">Session Time Will Be From 9:30 AM to 6:00 PM. On Sunday It Will Be From 9:30 AM to 12 PM</p>

      {/* Status bar */}
      {limits && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-slate-700 text-sm font-medium">
            Today: {limits.demosToday} / {limits.demosLimit} demo requests used
            &nbsp;·&nbsp;
            {limits.withinWindow ? <span className="text-emerald-600">Within demo hours</span> : <span className="text-red-500">Outside demo hours</span>}
          </p>
        </div>
      )}

      {/* Submit form */}
      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8 max-w-md space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Submit New Demo Request</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Credit Type</label>
          <select value={form.creditType} onChange={(e) => setForm({ ...form, creditType: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500">
            {CREDIT_TYPES.map((ct) => <option key={ct.key} value={ct.key}>{ct.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
          <input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })}
            placeholder="Enter your name"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 9876543210"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button type="submit" disabled={submitting || (limits && !limits.canSubmit)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
        {limits && !limits.canSubmit && (
          <p className="text-xs text-red-500">{limits.withinWindow ? 'Daily limit reached (2/day).' : 'Outside demo hours.'}</p>
        )}
      </form>

      {/* History */}
      <h2 className="text-lg font-semibold text-slate-800 mb-3">My Requests</h2>
      {loading ? <LoadingSpinner /> : list.length === 0 ? (
        <EmptyState message="No demo requests submitted yet." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Request For</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => {
                const ctLabel = CREDIT_TYPES.find((c) => c.key === r.creditType)?.label || 'Normal Credit';
                return (
                  <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 text-sm text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{ctLabel}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{r.userName || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{r.phone || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', ...(STATUS_STYLE[r.status] || STATUS_STYLE.pending) }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ClientLayout>
  );
}
