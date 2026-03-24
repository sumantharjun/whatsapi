import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import AdminCampaignComposer from '../../components/AdminCampaignComposer';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';
import { Send, Image, MousePointerClick, MessageSquare, Search, RefreshCw, Download } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TABS = [
  { key: 'text',   label: 'Campaign',      icon: Send,              title: 'Campaign',        breadcrumb: 'WhatsApp Bulk / Campaign' },
  { key: 'dp',     label: 'DP Campaign',   icon: Image,             title: 'DP Campaign',     breadcrumb: 'WhatsApp Bulk / DP Campaign' },
  { key: 'button', label: 'Button',        icon: MousePointerClick, title: 'Button Campaign', breadcrumb: 'WhatsApp Bulk / Button Campaign' },
  { key: 'action', label: 'Action Button', icon: MousePointerClick, title: 'Action Button',   breadcrumb: 'WhatsApp Bulk / Action Button' },
  { key: 'sms',    label: 'Button SMS',    icon: MessageSquare,     title: 'Button SMS',      breadcrumb: 'WhatsApp Bulk / Button SMS' },
];

const STATUS_COLORS = {
  completed: { bg: '#dcfce7', color: '#16a34a' },
  running:   { bg: '#dbeafe', color: '#2563eb' },
  paused:    { bg: '#fef3c7', color: '#d97706' },
  queued:    { bg: '#ede9fe', color: '#7c3aed' },
  draft:     { bg: '#f1f5f9', color: '#64748b' },
  cancelled: { bg: '#fee2e2', color: '#dc2626' },
};

/** Parse the structured pause reason string into a human-readable label. */
function parsePauseReason(reason) {
  if (!reason) return null;
  if (reason.startsWith('meta_block'))          return { icon: '🔴', text: 'Blocked by Meta — replace number', urgent: true };
  if (reason.startsWith('operator_block'))      return { icon: '🟠', text: 'Blocked by Operator/Carrier — try different SIM', urgent: true };
  if (reason.startsWith('all_numbers_blocked')) return { icon: '🚫', text: 'All numbers blocked — add new numbers', urgent: true };
  if (reason.startsWith('no_wa_sessions'))      return { icon: '📱', text: 'No WA sessions ready — scan QR in Accounts', urgent: true };
  if (reason.startsWith('manual_pause'))        return { icon: '⏸', text: 'Paused manually', urgent: false };
  return { icon: '⚠️', text: reason.split('—')[0].trim(), urgent: false };
}

export default function AdminCampaigns() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab]       = useState('text');
  const [campaigns, setCampaigns]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [exporting, setExporting]       = useState(null);
  const [alerts, setAlerts]             = useState([]); // { id, message, type }
  const esRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
    }
  }, [user, authLoading, router]);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try { const r = await api.campaigns.list(); setCampaigns(r.campaigns || []); }
    catch { setCampaigns([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  // SSE — real-time campaign events from the backend worker
  const connectSSE = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const es = new EventSource(`${BASE_URL}/api/campaigns/events?token=${token}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'campaign_paused') {
          const pr = parsePauseReason(data.reason);
          const msg = pr ? `${pr.icon} Campaign auto-paused: ${pr.text}` : 'Campaign auto-paused';
          toast.error(msg);
          // Add banner alert so admin doesn't miss it
          const alertId = Date.now();
          setAlerts((prev) => [...prev, { id: alertId, reason: data.reason, campaignId: data.campaignId }]);
          setTimeout(() => setAlerts((prev) => prev.filter((a) => a.id !== alertId)), 30000);
          load(true);
        }

        if (data.type === 'campaign_completed') {
          load(true);
        }

        if (data.type === 'wa_provisioning') {
          toast.success(`📱 ${data.message || `WhatsApp provisioning started for ${data.number}`}`);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setTimeout(connectSSE, 5000);
    };
  }, [load, toast]);

  useEffect(() => {
    if (!user) return;
    load();
    connectSSE();
    return () => { if (esRef.current) { esRef.current.close(); esRef.current = null; } };
  }, [user]);

  const startCampaign = async (id) => {
    setConfirmAction(null);
    try { await api.campaigns.start(id); await load(true); toast.success('Campaign started'); }
    catch (err) { toast.error(err.message); }
  };

  const pauseCampaign = async (id) => {
    setConfirmAction(null);
    try { await api.campaigns.pause(id); await load(true); toast.success('Campaign paused'); }
    catch (err) { toast.error(err.message); }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  const tab = TABS.find((t) => t.key === activeTab) || TABS[0];
  const typeMap = { text: 'text', dp: 'dp', button: 'button', action: 'button', sms: 'button' };

  const tabCampaigns = campaigns.filter((c) => {
    const matchType = !c.type || c.type === typeMap[activeTab];
    const matchSearch = !search.trim() || c.name?.toLowerCase().includes(search.trim().toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchType && matchSearch && matchStatus;
  });

  const totalSent   = tabCampaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const totalFailed = tabCampaigns.reduce((s, c) => s + (c.failedCount || 0), 0);

  return (
    <AdminLayout>
      <AdminCampaignComposer title={tab.title} breadcrumb={tab.breadcrumb} />

      {/* Live alerts — auto-dismissed after 30s */}
      {alerts.map((alert) => {
        const pr = parsePauseReason(alert.reason);
        return (
          <div key={alert.id} style={{ marginTop: 16, background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{pr?.icon || '⚠️'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Campaign Auto-Paused</div>
              <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 2 }}>{pr?.text || alert.reason}</div>
            </div>
            <button onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))} type="button"
              style={{ background: 'none', border: 'none', fontSize: 18, color: '#b91c1c', cursor: 'pointer', padding: 4 }}>✕</button>
          </div>
        );
      })}

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: 4, marginTop: 28, marginBottom: 20, borderBottom: '2px solid #e2e8f0', flexWrap: 'wrap' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => { setActiveTab(key); setSearch(''); setStatusFilter('all'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 700, fontSize: 13, marginBottom: -2, background: activeTab === key ? '#0f172a' : '#f1f5f9', color: activeTab === key ? '#fff' : '#64748b' }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Total',   value: tabCampaigns.length,                                    color: '#0f172a' },
          { label: 'Sent',    value: totalSent,                                               color: '#059669' },
          { label: 'Failed',  value: totalFailed,                                             color: '#dc2626' },
          { label: 'Running', value: tabCampaigns.filter((c) => c.status === 'running').length, color: '#2563eb' },
          { label: 'Paused',  value: tabCampaigns.filter((c) => c.status === 'paused').length,  color: '#d97706' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 18px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color }}>{value.toLocaleString()}</p>
          </div>
        ))}
        <button type="button" onClick={() => load(true)} disabled={refreshing} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="Search campaigns…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="all">All Status</option>
          {['draft','queued','running','paused','completed','cancelled'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : tabCampaigns.length === 0 ? (
        <EmptyState message={campaigns.length === 0 ? 'No campaigns yet.' : 'No campaigns match your filters.'} />
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  {['Campaign', 'Status', 'Recipients', 'Sent', 'Failed', 'Success %', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabCampaigns.map((c) => {
                  const rate = c.sentCount > 0 ? Math.round(((c.sentCount - (c.failedCount || 0)) / c.sentCount) * 100) : null;
                  const st   = STATUS_COLORS[c.status] || STATUS_COLORS.draft;
                  const pr   = c.status === 'paused' ? parsePauseReason(c.pauseReason) : null;
                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

                      <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 600, color: '#0f172a', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>

                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, textTransform: 'capitalize', background: st.bg, color: st.color }}>{c.status}</span>
                        {pr && (
                          <div title={c.pauseReason} style={{ fontSize: 11, color: pr.urgent ? '#b91c1c' : '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span>{pr.icon}</span>
                            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.text}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{c.recipientCount ?? 0}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#059669' }}>{c.sentCount ?? 0}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{c.failedCount ?? 0}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>
                        {rate !== null
                          ? <span style={{ fontWeight: 700, color: rate >= 80 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626' }}>{rate}%</span>
                          : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>

                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(c.status === 'draft' || c.status === 'paused') && (
                            <button type="button" onClick={() => setConfirmAction({ type: 'start', id: c._id, name: c.name, isResume: c.status === 'paused' })}
                              style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: c.status === 'paused' ? '#fef3c7' : '#dcfce7', color: c.status === 'paused' ? '#d97706' : '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              {c.status === 'paused' ? '▶ Resume' : 'Start'}
                            </button>
                          )}
                          {(c.status === 'running' || c.status === 'queued') && (
                            <button type="button" onClick={() => setConfirmAction({ type: 'pause', id: c._id, name: c.name })}
                              style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Pause</button>
                          )}
                          <button type="button" disabled={exporting === c._id}
                            onClick={async () => { setExporting(c._id); try { await api.campaigns.exportCsv(c._id); toast.success('Downloaded'); } catch (err) { toast.error(err.message); } finally { setExporting(null); } }}
                            style={{ padding: '4px 10px', border: '1px solid #bfdbfe', borderRadius: 6, background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Download size={11} /> CSV
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8', background: '#fafbfc' }}>
            {tabCampaigns.length} campaign{tabCampaigns.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <ConfirmModal open={confirmAction?.type === 'start'} title={confirmAction?.isResume ? 'Resume campaign' : 'Start campaign'}
        message={confirmAction?.isResume
          ? `Resume "${confirmAction?.name}"? Remaining credits will be deducted for pending recipients.`
          : `Start "${confirmAction?.name}"? Credits will be deducted.`}
        confirmLabel={confirmAction?.isResume ? 'Resume' : 'Start'}
        onConfirm={() => confirmAction && startCampaign(confirmAction.id)} onCancel={() => setConfirmAction(null)} />

      <ConfirmModal open={confirmAction?.type === 'pause'} title="Pause campaign"
        message={`Pause "${confirmAction?.name}"?`} confirmLabel="Pause"
        onConfirm={() => confirmAction && pauseCampaign(confirmAction.id)} onCancel={() => setConfirmAction(null)} />

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </AdminLayout>
  );
}
