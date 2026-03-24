import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useToast } from '../../../contexts/ToastContext';

export default function AdminReportCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
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

  const userOptions = useMemo(() => {
    const set = new Set();
    campaigns.forEach((c) => {
      const name = c.userName || c.ownerName || c.user?.email || c.userId?.email;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [campaigns]);

  return (
    <AdminLayout>
      <form
        onSubmit={handleSubmit}
        className="admin-report-filter"
      >
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="admin-report-input"
        >
          <option value="">Select User</option>
          {userOptions.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <label className="admin-report-date">
          <span>Start</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="admin-report-input"
          />
        </label>
        <label className="admin-report-date">
          <span>End</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="admin-report-input"
          />
        </label>
        <div />
        <button
          type="submit"
          className="admin-report-submit"
        >
          Submit
        </button>
      </form>

      {loading ? <LoadingSpinner /> : (
        <div className="admin-report-table">
          <div className="admin-report-table-head" />
          <div className="admin-report-table-wrap">
            <table className="admin-report-table-grid">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User Name</th>
                  <th>Campaign Name</th>
                  <th>Number Count</th>
                  <th>Type</th>
                  <th>T&amp;C</th>
                  <th>Campaign Submit</th>
                  <th>Campaign Report</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-report-empty">
                      <EmptyState message="No campaigns." />
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c, index) => (
                    <tr key={c._id}>
                      <td>{index + 1}</td>
                      <td>{c.userName || c.ownerName || c.user?.email || '-'}</td>
                      <td>{c.name || '-'}</td>
                      <td>{c.numberCount ?? c.totalNumbers ?? '-'}</td>
                      <td>{c.type || '-'}</td>
                      <td>{c.termsAccepted ? 'Yes' : '-'}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                      <td>
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
                          className="admin-report-link"
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
