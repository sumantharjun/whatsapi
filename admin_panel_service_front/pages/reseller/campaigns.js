import { useEffect, useState } from 'react';
import ResellerLayout from '../../components/ResellerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function ResellerCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'reseller')) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.campaigns.list()
      .then((r) => setCampaigns(r.campaigns || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <ResellerLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Campaigns (all clients)</h1>
        <p className="text-slate-500 text-sm mt-0.5">View campaigns from your clients</p>
      </div>
      {loading ? <LoadingSpinner /> : campaigns.length === 0 ? <EmptyState message="No campaigns yet." /> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Recipients</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Sent</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Failed</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{c.name}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.status} />
                    {c.status === 'paused' && c.pauseReason && (
                      <div style={{ fontSize: 10, color: c.pauseReason.startsWith('all_numbers_blocked') ? '#dc2626' : '#b45309', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={c.pauseReason.replace(/^[^—]*—\s*/, '') || c.pauseReason}>
                        {c.pauseReason.startsWith('all_numbers_blocked') ? '🚫 Number blocked' : c.pauseReason.startsWith('manual_pause') ? '⏸ Manual pause' : '⚠️ ' + (c.pauseReason.split('—')[0] || 'Paused')}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{c.recipientCount ?? 0}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c.sentCount ?? 0}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c.failedCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ResellerLayout>
  );
}
