import { useEffect, useState } from 'react';
import ResellerLayout from '../../components/ResellerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function ResellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'reseller')) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.analytics.overview()
      .then(setData)
      .catch(() => setData({ overview: {}, creditBalance: 0 }))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ResellerLayout>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>Dashboard</h1>
      {loading ? <LoadingSpinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Your Credits</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{data?.creditBalance ?? 0}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Total Campaigns (Clients)</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{data?.overview?.totalCampaigns ?? 0}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Total Sent</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{data?.overview?.totalSent ?? 0}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Clients</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{data?.overview?.userCount ?? 0}</p>
          </div>
        </div>
      )}
    </ResellerLayout>
  );
}
