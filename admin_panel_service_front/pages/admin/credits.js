import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useToast } from '../../contexts/ToastContext';

export default function AdminCredits() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [granting, setGranting] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const loadUsers = () => api.users.list().then((r) => setUsers(r.users || []));
  const loadHistory = () => api.credits.history().then((r) => setHistory(r.list || []));

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    Promise.all([loadUsers(), loadHistory()])
      .catch(() => {
        setUsers([]);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !amount || parseInt(amount, 10) <= 0) {
      toast.error('Select a user and enter a positive amount.');
      return;
    }
    setGranting(true);
    try {
      await api.credits.purchase(selectedUserId, parseInt(amount, 10));
      toast.success('Credits granted');
      setAmount('');
      setSelectedUserId('');
      await Promise.all([loadUsers(), loadHistory()]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGranting(false);
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  const resellersAndClients = users.filter((u) => u.role === 'reseller' || u.role === 'client');

  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toISOString().replace('T', ' ').slice(0, 19);
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Credit Management</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Dashboard / Credit Management</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' }}>Grant credits</h2>
        <form onSubmit={handleGrant} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>User</label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, minWidth: 200 }}>
              <option value="">Select user</option>
              {resellersAndClients.map((u) => (
                <option key={u._id} value={u._id}>{u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>Amount</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Credits" style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: 120 }} />
          </div>
          <button type="submit" disabled={granting} style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{granting ? 'Granting...' : 'Grant'}</button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>UserName</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Balance Type</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Balance</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Credit Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Credit Note</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '16px 12px' }}>
                      <EmptyState message="No credit transactions yet." />
                    </td>
                  </tr>
                ) : (
                  history.map((t) => (
                    <tr key={t._id || t.createdAt} style={{ borderBottom: '1px solid #eef2f7' }}>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#0f172a' }}>{t._id || t.id || '-'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{t.userName || t.username || t.userEmail || '-'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{t.type || t.balanceType || '-'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{t.amount ?? t.balance ?? '-'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{formatDate(t.createdAt || t.creditDate)}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{t.note || t.creditNote || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
