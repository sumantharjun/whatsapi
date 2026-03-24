import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { BarChart3, Send, XCircle, CheckCircle2, PlayCircle, Clock, RefreshCw, Users } from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const [analytics, usersRes, campaignsRes] = await Promise.all([
        api.analytics.overview().catch(() => ({ overview: {} })),
        api.users.list().catch(() => ({ users: [] })),
        api.campaigns.list().catch(() => ({ campaigns: [] })),
      ]);
      setData(analytics);
      setUsers(usersRes.users || []);
      setCampaigns(campaignsRes.campaigns || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    load();
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const ov = data?.overview || {};
  const totalCampaigns = campaigns.length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length;
  const runningCampaigns = campaigns.filter((c) => c.status === 'running').length;
  const draftCampaigns = campaigns.filter((c) => c.status === 'draft').length;
  const totalSent = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const totalFailed = campaigns.reduce((s, c) => s + (c.failedCount || 0), 0);
  const successRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 0;
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive !== false).length;
  const clientUsers = users.filter((u) => u.role === 'client').length;
  const resellerUsers = users.filter((u) => u.role === 'reseller').length;

  const statCards = [
    { icon: Send, label: 'Total Sent', value: (ov.totalSent ?? totalSent).toLocaleString(), color: '#059669', bg: '#dcfce7' },
    { icon: XCircle, label: 'Total Failed', value: (ov.totalFailed ?? totalFailed).toLocaleString(), color: '#dc2626', bg: '#fee2e2' },
    { icon: CheckCircle2, label: 'Completed', value: (ov.completed ?? completedCampaigns).toLocaleString(), color: '#7c3aed', bg: '#ede9fe' },
    { icon: PlayCircle, label: 'Running', value: (ov.running ?? runningCampaigns).toLocaleString(), color: '#2563eb', bg: '#dbeafe' },
    { icon: Clock, label: 'Draft', value: draftCampaigns.toLocaleString(), color: '#d97706', bg: '#fef3c7' },
    { icon: BarChart3, label: 'Total Campaigns', value: totalCampaigns.toLocaleString(), color: '#0f172a', bg: '#f1f5f9' },
    { icon: Users, label: 'Total Users', value: totalUsers.toLocaleString(), color: '#0f172a', bg: '#f1f5f9' },
    { icon: Users, label: 'Active Users', value: activeUsers.toLocaleString(), color: '#059669', bg: '#dcfce7' },
  ];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={22} /> Analytics
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Dashboard / Analytics</p>
        </div>
        <button type="button" onClick={() => load(true)} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            {statCards.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={color} />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                </div>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Success Rate */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Delivery Rate</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 40, fontWeight: 800, color: successRate >= 80 ? '#059669' : successRate >= 50 ? '#d97706' : '#dc2626', lineHeight: 1 }}>{successRate}%</p>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#94a3b8' }}>success rate</p>
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${successRate}%`, height: '100%', background: successRate >= 80 ? '#059669' : successRate >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 99, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                <span>Sent: <b style={{ color: '#059669' }}>{totalSent.toLocaleString()}</b></span>
                <span>Failed: <b style={{ color: '#dc2626' }}>{totalFailed.toLocaleString()}</b></span>
              </div>
            </div>

            {/* User Breakdown */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>User Breakdown</h2>
              {[
                { label: 'Clients', value: clientUsers, color: '#2563eb', bg: '#dbeafe' },
                { label: 'Resellers', value: resellerUsers, color: '#7c3aed', bg: '#ede9fe' },
                { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: '#0f172a', bg: '#f1f5f9' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', minWidth: 70 }}>{label}</span>
                  <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: totalUsers > 0 ? `${(value / totalUsers) * 100}%` : '0%', height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 24, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Campaigns */}
          {campaigns.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Campaigns</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Campaign', 'Type', 'Status', 'Sent', 'Failed', 'Success %'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 10).map((c) => {
                      const rate = c.sentCount > 0 ? Math.round(((c.sentCount - (c.failedCount || 0)) / c.sentCount) * 100) : null;
                      const statusColors = { completed: '#059669', running: '#2563eb', paused: '#d97706', queued: '#7c3aed', draft: '#94a3b8', cancelled: '#dc2626' };
                      return (
                        <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{c.type || 'text'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize', color: statusColors[c.status] || '#64748b', background: `${statusColors[c.status] || '#64748b'}18` }}>{c.status}</span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#059669' }}>{c.sentCount ?? 0}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{c.failedCount ?? 0}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13 }}>
                            {rate !== null ? <span style={{ fontWeight: 700, color: rate >= 80 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626' }}>{rate}%</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </AdminLayout>
  );
}
