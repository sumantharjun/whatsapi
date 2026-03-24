import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Download, Search, RefreshCw, CheckCircle2, XCircle, Send, BarChart3 } from 'lucide-react';

const STATUS_COLOR = {
  completed: { bg: '#dcfce7', color: '#16a34a' },
  running:   { bg: '#dbeafe', color: '#2563eb' },
  paused:    { bg: '#fef3c7', color: '#d97706' },
  queued:    { bg: '#ede9fe', color: '#7c3aed' },
  draft:     { bg: '#f1f5f9', color: '#64748b' },
  cancelled: { bg: '#fee2e2', color: '#dc2626' },
};

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{(value ?? 0).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function WhatsAppReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const r = await api.campaigns.list();
      setCampaigns(r.campaigns || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || !['client', 'reseller'].includes(user.role))) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/login') : '/login');
      return;
    }
    if (!user) return;
    load();
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const totalSent = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const totalFailed = campaigns.reduce((s, c) => s + (c.failedCount || 0), 0);
  const completed = campaigns.filter((c) => c.status === 'completed').length;
  const successRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 0;

  const filtered = campaigns.filter((c) => {
    const matchSearch = !search.trim() || c.name?.toLowerCase().includes(search.trim().toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = ['all', ...Array.from(new Set(campaigns.map((c) => c.status)))];

  return (
    <ClientLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>WhatsApp Report</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Delivery performance across all your campaigns.</p>
          </div>
          <button type="button" onClick={() => load(true)} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon={BarChart3} label="Total Campaigns" value={campaigns.length} color="#2563eb" bg="#eff6ff" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed} color="#059669" bg="#dcfce7" />
          <StatCard icon={Send} label="Messages Sent" value={totalSent} color="#7c3aed" bg="#f5f3ff" />
          <StatCard icon={XCircle} label="Failed" value={totalFailed} color="#dc2626" bg="#fee2e2" />
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Success Rate</p>
            <p style={{ margin: '3px 0 4px', fontSize: 22, fontWeight: 800, color: successRate >= 80 ? '#059669' : successRate >= 50 ? '#d97706' : '#dc2626', lineHeight: 1 }}>{successRate}%</p>
            <div style={{ height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: successRate >= 80 ? '#059669' : successRate >= 50 ? '#d97706' : '#dc2626', width: `${successRate}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search campaigns…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {statuses.map((st) => (
              <button key={st} type="button" onClick={() => setStatusFilter(st)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', background: statusFilter === st ? '#0f172a' : '#f1f5f9', color: statusFilter === st ? '#fff' : '#64748b' }}>
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState message={campaigns.length === 0 ? 'No campaigns yet. Run a campaign to see reports.' : 'No campaigns match your search.'} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    {['Campaign', 'Type', 'Status', 'Recipients', 'Sent', 'Failed', 'Success Rate', 'Export'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const rate = c.sentCount > 0 ? Math.round(((c.sentCount - (c.failedCount || 0)) / c.sentCount) * 100) : null;
                    const st = STATUS_COLOR[c.status] || STATUS_COLOR.draft;
                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0f172a', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569' }}>
                            {c.type === 'dp' ? 'DP' : c.type === 'button' ? 'Button' : 'Text'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize', background: st.bg, color: st.color }}>{c.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{c.recipientCount ?? 0}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#059669' }}>{c.sentCount ?? 0}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{c.failedCount ?? 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {rate !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: rate >= 80 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626', minWidth: 36 }}>{rate}%</span>
                              <div style={{ flex: 1, height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden', minWidth: 60 }}>
                                <div style={{ height: '100%', borderRadius: 99, background: rate >= 80 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626', width: `${rate}%` }} />
                              </div>
                            </div>
                          ) : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button type="button" disabled={exporting === c._id}
                            onClick={async () => { setExporting(c._id); try { await api.campaigns.exportCsv(c._id); toast.success('Downloaded'); } catch (err) { toast.error(err.message); } finally { setExporting(null); } }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: 7, background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: exporting === c._id ? 0.6 : 1 }}>
                            <Download size={12} /> {exporting === c._id ? '…' : 'CSV'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8', background: '#fafbfc' }}>
              Showing {filtered.length} of {campaigns.length} campaigns
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </ClientLayout>
  );
}
