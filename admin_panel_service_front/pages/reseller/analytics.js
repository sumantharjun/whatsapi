import { useEffect, useState } from 'react';
import ResellerLayout from '../../components/ResellerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { BarChart3, Send, XCircle, CheckCircle2, PlayCircle, Clock, RefreshCw } from 'lucide-react';

export default function ResellerAnalytics() {
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const [analytics, campaignsRes] = await Promise.all([
        api.analytics.overview().catch(() => ({ overview: {} })),
        api.campaigns.list().catch(() => ({ campaigns: [] })),
      ]);
      setData(analytics);
      setCampaigns(campaignsRes.campaigns || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'reseller')) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    load();
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const ov = data?.overview || {};
  const totalSent = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
  const totalFailed = campaigns.reduce((s, c) => s + (c.failedCount || 0), 0);
  const runningCampaigns = campaigns.filter((c) => c.status === 'running').length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length;
  const draftCampaigns = campaigns.filter((c) => c.status === 'draft').length;
  const successRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 0;

  const statCards = [
    { icon: Send, label: 'Total Sent', value: (ov.totalSent ?? totalSent).toLocaleString(), color: '#059669', bg: '#dcfce7' },
    { icon: XCircle, label: 'Total Failed', value: (ov.totalFailed ?? totalFailed).toLocaleString(), color: '#dc2626', bg: '#fee2e2' },
    { icon: CheckCircle2, label: 'Completed', value: (ov.completed ?? completedCampaigns).toLocaleString(), color: '#7c3aed', bg: '#ede9fe' },
    { icon: PlayCircle, label: 'Running', value: (ov.running ?? runningCampaigns).toLocaleString(), color: '#2563eb', bg: '#dbeafe' },
    { icon: Clock, label: 'Draft', value: draftCampaigns.toLocaleString(), color: '#d97706', bg: '#fef3c7' },
    { icon: BarChart3, label: 'Total Campaigns', value: campaigns.length.toLocaleString(), color: '#0f172a', bg: '#f1f5f9' },
  ];

  return (
    <ResellerLayout>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            {statCards.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                </div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Success Rate */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 24, maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Delivery Rate</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 38, fontWeight: 800, color: successRate >= 80 ? '#059669' : successRate >= 50 ? '#d97706' : '#dc2626', lineHeight: 1 }}>{successRate}%</p>
              <p style={{ margin: '0 0 3px', fontSize: 13, color: '#94a3b8' }}>success rate</p>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: `${successRate}%`, height: '100%', background: successRate >= 80 ? '#059669' : successRate >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
              <span>Sent: <b style={{ color: '#059669' }}>{totalSent.toLocaleString()}</b></span>
              <span>Failed: <b style={{ color: '#dc2626' }}>{totalFailed.toLocaleString()}</b></span>
            </div>
          </div>

          {/* Campaign Status Breakdown */}
          {campaigns.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Campaign Status Breakdown</h2>
              {[
                { label: 'Completed', count: completedCampaigns, color: '#059669' },
                { label: 'Running', count: runningCampaigns, color: '#2563eb' },
                { label: 'Draft', count: draftCampaigns, color: '#d97706' },
                { label: 'Paused', count: campaigns.filter((c) => c.status === 'paused').length, color: '#f59e0b' },
              ].filter((s) => s.count > 0).map(({ label, count, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', minWidth: 80 }}>{label}</span>
                  <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: campaigns.length > 0 ? `${(count / campaigns.length) * 100}%` : '0%', height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 24, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </ResellerLayout>
  );
}
