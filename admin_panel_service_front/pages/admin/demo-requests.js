import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useToast } from '../../contexts/ToastContext';

const CREDIT_TYPE_LABELS = {
  normal: 'Normal Credit',
  r_btn: 'R-Btn Credit',
  action_btn: 'Action Btn Credit',
  btn_sms: 'Btn-SMS Credit',
};

export default function AdminDemoRequests() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => api.demoRequests.list().then((r) => setList(r.list || [])).catch(() => setList([]));

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    load().finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.demoRequests.update(id, status);
      toast.success(`Request ${status}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const userName = r.userName || r.userId?.email || r.userId || '';
      const phone = r.phone || r.mobile || r.mobileNumber || '';
      const type = r.type || r.requestFor || '';
      return `${userName} ${phone} ${type}`.toLowerCase().includes(q);
    });
  }, [list, search]);

  if (authLoading || !user) return null;

  const statusStyle = (status) => {
    if (status === 'approved') return { background: '#16a34a', color: '#fff' };
    if (status === 'rejected') return { background: '#64748b', color: '#fff' };
    return { background: '#ef4444', color: '#fff' };
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
          Search:
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', width: 220 }}
          />
        </label>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '12px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>ID</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>UserName</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Request For</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Phone No</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Req. At</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '16px 12px' }}>
                      <EmptyState message="No demo requests yet." />
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, index) => (
                    <tr key={r._id || r.createdAt || index} style={{ borderBottom: '1px solid #eef2f7' }}>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#0f172a' }}>{r._id || index + 1}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#0f172a' }}>
                        {r.userName || r.userId?.email || '-'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{CREDIT_TYPE_LABELS[r.creditType] || r.type || r.requestFor || 'Normal Credit'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{r.phone || r.mobile || r.mobileNumber || '-'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>
                        {r.createdAt ? new Date(r.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '-'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-block', minWidth: 80, textAlign: 'center', padding: '6px 12px', borderRadius: 6, fontWeight: 600, ...statusStyle(r.status) }}>
                          {r.status || 'Pending'}
                        </span>
                        {r.status === 'pending' && (
                          <span style={{ marginLeft: 10 }}>
                            <button type="button" disabled={updating === r._id} onClick={() => handleStatus(r._id, 'approved')} style={{ marginRight: 8, padding: '6px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Approve</button>
                            <button type="button" disabled={updating === r._id} onClick={() => handleStatus(r._id, 'rejected')} style={{ padding: '6px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Reject</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', color: '#475569', fontSize: 13 }}>
            Showing 1 to {filtered.length} of {filtered.length} entries
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
