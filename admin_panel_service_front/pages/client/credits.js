import { useEffect, useState } from 'react';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

const CREDIT_TYPES = [
  { key: 'normal', label: 'Normal Credit', balanceKey: 'creditBalance', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'r_btn', label: 'R-Btn Credit', balanceKey: 'rBtnCredit', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'action_btn', label: 'Action Btn Credit', balanceKey: 'actionBtnCredit', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'btn_sms', label: 'Btn-SMS Credit', balanceKey: 'btnSmsCredit', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
];

function RequestDemoModal({ creditType, onClose, onSuccess }) {
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim()) { toast.error('Please enter your name'); return; }
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    setSubmitting(true);
    try {
      await api.demoRequests.submit({ creditType: creditType.key, userName: userName.trim(), phone: phone.trim() });
      toast.success('Demo request submitted successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 24px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: 0 }}>Request Demo</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{creditType.label}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Your Name</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px 0', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, background: creditType.color, color: '#fff', fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientCredits() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('credit');
  const [modalCreditType, setModalCreditType] = useState(null);
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !['client', 'reseller'].includes(user.role))) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/login') : '/login');
      return;
    }
    if (!user) return;
    refresh();
    api.credits.history()
      .then((r) => setHistory(r.list || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, refresh]);

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Credits</h1>
        <p className="text-slate-500 text-sm mt-0.5">Balance and transaction history.</p>
      </div>

      {/* Credit Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16, marginBottom: 32 }}>
        {CREDIT_TYPES.map((ct) => (
          <div key={ct.key} style={{ background: ct.bg, border: `1.5px solid ${ct.border}`, borderRadius: 14, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: ct.color, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ct.label}</p>
            <p style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.1 }}>{user[ct.balanceKey] ?? 0}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Available credits</p>
            <button
              type="button"
              onClick={() => setModalCreditType(ct)}
              style={{ marginTop: 8, padding: '7px 0', borderRadius: 8, border: `1.5px solid ${ct.border}`, background: '#fff', color: ct.color, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Request Demo
            </button>
          </div>
        ))}
      </div>

      {/* History Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        <button type="button" onClick={() => setTab('credit')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === 'credit' ? 'bg-slate-100 text-slate-800 border border-slate-200 border-b-0' : 'text-slate-600 hover:bg-slate-50'}`}>Credit</button>
        <button type="button" onClick={() => setTab('wapp')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${tab === 'wapp' ? 'bg-slate-100 text-slate-800 border border-slate-200 border-b-0' : 'text-slate-600 hover:bg-slate-50'}`}>Wapp BTN : {(user.rBtnCredit ?? 0).toFixed(2)}</button>
      </div>
      <h2 className="text-lg font-semibold text-slate-800 mb-3">History</h2>
      {loading ? <LoadingSpinner /> : history.length === 0 ? <EmptyState message="No transactions yet." /> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {history.map((t) => (
                <tr key={t._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 text-sm text-slate-600">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3.5 capitalize text-slate-800">{t.type}</td>
                  <td className="px-5 py-3.5 font-medium">{t.amount > 0 ? `+${t.amount}` : t.amount}</td>
                  <td className="px-5 py-3.5 text-slate-600">{t.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCreditType && (
        <RequestDemoModal
          creditType={modalCreditType}
          onClose={() => setModalCreditType(null)}
          onSuccess={() => setModalCreditType(null)}
        />
      )}
    </ClientLayout>
  );
}
