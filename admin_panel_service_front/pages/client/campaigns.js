import { useEffect, useState } from 'react';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import AdminCampaignComposer from '../../components/AdminCampaignComposer';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

export default function ClientCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const load = () => api.campaigns.list().then((r) => setCampaigns(r.campaigns || []));

  useEffect(() => {
    if (!authLoading && (!user || !['client', 'reseller'].includes(user.role))) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/login') : '/login');
      return;
    }
    if (!user) return;
    load().catch(() => setCampaigns([])).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const startCampaign = async (id) => {
    setConfirmAction(null);
    try {
      await api.campaigns.start(id);
      await load();
      toast.success('Campaign started');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const pauseCampaign = async (id) => {
    setConfirmAction(null);
    try {
      await api.campaigns.pause(id);
      await load();
      toast.success('Campaign paused');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <ClientLayout>
      <AdminCampaignComposer
        title="Campaign"
        breadcrumb="WhatsApp Bulk / Campaign"
      />
      <div className="client-page-head">
        <div>
          <h1>Campaign History</h1>
          <p>Track status, recipients, and delivery results.</p>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="all">All Status</option>
          {['draft','queued','running','paused','completed','cancelled'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : campaigns.length === 0 ? <EmptyState message="No campaigns yet. Create one to get started." /> : (
        <div className="client-table-card">
          <table className="client-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Sent / Failed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.filter((c) => {
                const matchSearch = !search.trim() || c.name?.toLowerCase().includes(search.trim().toLowerCase());
                const matchStatus = statusFilter === 'all' || c.status === statusFilter;
                return matchSearch && matchStatus;
              }).map((c) => (
                <tr key={c._id}>
                  <td className="client-td-strong">{c.name}</td>
                  <td>{c.type === 'dp' ? 'DP' : c.type === 'button' ? 'Button' : 'Text'}</td>
                  <td>
                    <StatusBadge status={c.status} />
                    {c.status === 'paused' && c.pauseReason && (
                      <div className={`client-pause-reason ${c.pauseReason.startsWith('all_numbers_blocked') ? 'is-blocked' : c.pauseReason.startsWith('manual_pause') ? 'is-manual' : 'is-warning'}`}
                        title={c.pauseReason.replace(/^[^—]*—\s*/, '') || c.pauseReason}>
                        {c.pauseReason.startsWith('all_numbers_blocked') ? '🚫 Number blocked' : c.pauseReason.startsWith('manual_pause') ? '⏸ Manual pause' : '⚠️ ' + (c.pauseReason.split('—')[0] || 'Paused')}
                      </div>
                    )}
                  </td>
                  <td>{c.recipientCount ?? 0}</td>
                  <td>{c.sentCount ?? 0} <span className="client-muted">/</span> {c.failedCount ?? 0}</td>
                  <td>
                    <div className="client-action-row">
                      {(c.status === 'draft' || c.status === 'paused') && (
                        <button type="button" onClick={() => setConfirmAction({ type: 'start', id: c._id, name: c.name })} className="client-link client-link-success">Start</button>
                      )}
                      {(c.status === 'running' || c.status === 'queued') && (
                        <button type="button" onClick={() => setConfirmAction({ type: 'pause', id: c._id, name: c.name })} className="client-link client-link-warn">Pause</button>
                      )}
                      <a href={`/client/campaigns/${c._id}`} className="client-link client-link-slate">{c.status === 'draft' ? 'Edit / Add recipients' : 'View'}</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal
        open={confirmAction?.type === 'start'}
        title="Start campaign"
        message={`Start "${confirmAction?.name}"? Credits will be deducted.`}
        confirmLabel="Start"
        onConfirm={() => confirmAction && startCampaign(confirmAction.id)}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmModal
        open={confirmAction?.type === 'pause'}
        title="Pause campaign"
        message={`Pause "${confirmAction?.name}"?`}
        confirmLabel="Pause"
        onConfirm={() => confirmAction && pauseCampaign(confirmAction.id)}
        onCancel={() => setConfirmAction(null)}
      />
    </ClientLayout>
  );
}






