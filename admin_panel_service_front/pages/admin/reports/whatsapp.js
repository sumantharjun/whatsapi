import { useEffect, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useToast } from '../../../contexts/ToastContext';

export default function AdminReportWhatsApp() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.campaigns.list().then((r) => setCampaigns(r.campaigns || [])).catch(() => setCampaigns([])).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <AdminLayout>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          padding: '18px 16px',
          background: '#fff',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          marginBottom: 24,
        }}
      >
        <label style={{ fontSize: 16, color: '#0f172a' }}>
          Start
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              marginLeft: 12,
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              minWidth: 220,
              fontSize: 14,
            }}
          />
        </label>
        <label style={{ fontSize: 16, color: '#0f172a' }}>
          End
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              marginLeft: 12,
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              minWidth: 220,
              fontSize: 14,
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            background: '#2d3fa5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 22px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
          }}
        >
          Submit
        </button>
      </form>
      {loading ? <LoadingSpinner /> : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
          <div style={{ padding: '18px 20px 8px', fontSize: 16, color: '#0f172a' }}>
            It&apos;ll available for the next 60 days only. If we will be informed within 12 hours
          </div>
          <div style={{ padding: '0 16px 18px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>ID</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>User Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Campaign Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Number Count</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Campaign List</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Type</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>T&amp;C</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Campaign Submit</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Campaign Report</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '16px 12px' }}>
                      <EmptyState message="No campaigns." />
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c, index) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid #eef2f7' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#0f172a' }}>{index + 1}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>{c.userName || c.ownerName || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#0f172a' }}>{c.name || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>{c.numberCount ?? c.totalNumbers ?? '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>{c.listName || c.campaignList || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>{c.type || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>{c.termsAccepted ? 'Yes' : '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#475569' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          type="button"
                          disabled={exporting === c._id}
                          onClick={async () => {
                            setExporting(c._id);
                            try {
                              await api.campaigns.exportCsv(c._id);
                              toast.success('CSV downloaded');
                            } catch (e) {
                              toast.error(e.message);
                            } finally {
                              setExporting(null);
                            }
                          }}
                          style={{ fontSize: 13, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {exporting === c._id ? '...' : 'View'}
                        </button>
                      </td>
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
