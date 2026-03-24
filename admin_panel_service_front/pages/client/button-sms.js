import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import AdminCampaignComposer from '../../components/AdminCampaignComposer';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function ButtonSMSPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);

  const load = () => api.campaigns.list().then((r) => setCampaigns((r.campaigns || []).filter((c) => c.type === 'button')));

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
    try { await api.campaigns.start(id); await load(); toast.success('Campaign started'); }
    catch (err) { toast.error(err.message); }
  };

  const pauseCampaign = async (id) => {
    setConfirmAction(null);
    try { await api.campaigns.pause(id); await load(); toast.success('Campaign paused'); }
    catch (err) { toast.error(err.message); }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <ClientLayout>
      <AdminCampaignComposer title="Button SMS Campaign" breadcrumb="WhatsApp Bulk / Button SMS" />

      <div className="client-page-head">
        <div>
          <h1>Button SMS History</h1>
          <p>SMS campaigns with interactive button options.</p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : campaigns.length === 0 ? (
        <EmptyState message="No Button SMS campaigns yet. Create one using the composer above." />
      ) : (
        <div className="client-table-card">
          <table className="client-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Sent / Failed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id}>
                  <td className="client-td-strong">{c.name}</td>
                  <td>
                    <StatusBadge status={c.status} />
                    {c.status === 'paused' && c.pauseReason && (
                      <div className={`client-pause-reason ${c.pauseReason.startsWith('all_numbers_blocked') ? 'is-blocked' : c.pauseReason.startsWith('manual_pause') ? 'is-manual' : 'is-warning'}`}>
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
                      <a href={`/client/campaigns/${c._id}`} className="client-link client-link-slate">View</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal open={confirmAction?.type === 'start'} title="Start campaign"
        message={`Start "${confirmAction?.name}"? Credits will be deducted.`} confirmLabel="Start"
        onConfirm={() => confirmAction && startCampaign(confirmAction.id)} onCancel={() => setConfirmAction(null)} />
      <ConfirmModal open={confirmAction?.type === 'pause'} title="Pause campaign"
        message={`Pause "${confirmAction?.name}"?`} confirmLabel="Pause"
        onConfirm={() => confirmAction && pauseCampaign(confirmAction.id)} onCancel={() => setConfirmAction(null)} />
    </ClientLayout>
  );
}
