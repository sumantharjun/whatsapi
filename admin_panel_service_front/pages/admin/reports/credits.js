import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function AdminReportCredits() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.credits.history().then((r) => setHistory(r.list || [])).catch(() => setHistory([])).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toISOString().replace('T', ' ').slice(0, 19);
  };

  const stats = [
    { label: 'Wapp', value: '32408' },
    { label: 'Wapp BTN', value: '4687.00' },
    { label: 'Wapi', value: '2' },
  ];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          <div style={{ background: '#1ea7d8', color: '#fff', padding: '10px 18px', fontWeight: 600 }}>Credit</div>
          <div style={{ background: 'linear-gradient(90deg,#3f3aa8,#4541c3)', color: '#fff', padding: '10px 18px', display: 'flex', gap: 24 }}>
            {stats.map((s) => (
              <span key={s.label} style={{ fontWeight: 600 }}>{s.label} : {s.value}</span>
            ))}
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Dashboard&nbsp; / &nbsp;<span style={{ color: '#64748b' }}>Manage History</span></div>
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
