import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  CreditCard,
  CalendarClock,
  MousePointerClick,
  MessagesSquare,
  BarChart3,
  Loader,
  Hourglass,
  Zap,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [number, setNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.analytics.adminDashboard()
      .then(setData)
      .catch(() => setData({
        normalCredit: 0, rBtnCredit: 0, actionBtnCredit: 0, btnSmsCredit: 0, apiDaysCredit: 0,
        totalCampaign: 0, inProcessCampaigns: 0, pendingCampaigns: 0,
      }))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleCreateCampaign = async () => {
    setSaving(true);
    try {
      await api.campaigns.create({ name: number, messageBody: number, type: 'text' });
      setShowCreateModal(false);
      setShowSuccessModal(true);
      setNumber('');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const creditCards = [
    { label: 'Normal Credit', value: data?.normalCredit ?? 0, tone: 'blue', icon: CreditCard },
    { label: 'R-Btn Credit', value: data?.rBtnCredit ?? 0, tone: 'indigo', icon: MousePointerClick },
    { label: 'Action Btn Credit', value: data?.actionBtnCredit ?? 0, tone: 'slate', icon: Zap },
    { label: 'Btn-SMS Credit', value: data?.btnSmsCredit ?? 0, tone: 'emerald', icon: MessagesSquare },
  ];

  const campaignCards = [
    { label: 'API Days Credit', value: data?.apiDaysCredit ?? 0, tone: 'amber', icon: CalendarClock, hint: 'Days remaining' },
    { label: 'Total Campaigns', value: data?.totalCampaign ?? 0, tone: 'emerald', icon: BarChart3, hint: 'Lifetime' },
    { label: 'In Process', value: data?.inProcessCampaigns ?? 0, tone: 'orange', icon: Loader, hint: 'Running now' },
    { label: 'Pending', value: data?.pendingCampaigns ?? 0, tone: 'rose', icon: Hourglass, hint: 'Waiting approval' },
  ];

  const totalCredits = creditCards.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <AdminLayout>
      <div className="admin-dash-shell">
        <div className="admin-dash-hero">
          <div className="admin-dash-hero-main">
            <p className="admin-dash-kicker">Admin Control</p>
            <div>
              <h1 className="admin-dash-title">Dashboard</h1>
              <p className="admin-dash-subtitle">Track credits, campaign flow, and approvals in one glance.</p>
              <p className="admin-dash-breadcrumb">WhatsApp Bulk / Dashboard</p>
            </div>
            <div className="admin-dash-kpi-row">
              <div className="admin-dash-kpi">
                <p className="admin-dash-kpi-value">{totalCredits.toLocaleString()}</p>
                <p className="admin-dash-kpi-label">Total Credits</p>
              </div>
              <div className="admin-dash-kpi">
                <p className="admin-dash-kpi-value">{(data?.inProcessCampaigns ?? 0).toLocaleString()}</p>
                <p className="admin-dash-kpi-label">Active Campaigns</p>
              </div>
              <div className="admin-dash-kpi">
                <p className="admin-dash-kpi-value">{(data?.pendingCampaigns ?? 0).toLocaleString()}</p>
                <p className="admin-dash-kpi-label">Pending Approvals</p>
              </div>
            </div>
          </div>

          <div className="admin-dash-hero-panel">
            <div className="admin-dash-actions">
              <button type="button" className="admin-primary-btn" onClick={() => setShowCreateModal(true)}>
                Create Campaign
              </button>
              <Link href="/admin/campaigns" className="admin-secondary-btn">
                View Campaigns
              </Link>
            </div>
            <div className="admin-dash-hero-meta">
              <div>Last sync</div>
              <strong>Just now</strong>
              <Link href="/admin/reports/campaigns" className="admin-dash-hero-link">
                Open campaign reports
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <section className="admin-dash-section">
              <div className="admin-dash-section-head">
                <div>
                  <h2 className="admin-dash-section-title">Credits Overview</h2>
                  <p className="admin-dash-section-sub">Quick balance snapshot across all credit pools.</p>
                </div>
                <span className="admin-dash-chip">Live balance</span>
              </div>
              <div className="admin-dash-grid admin-dash-grid-4">
                {creditCards.map(({ label, value, tone, icon: Icon }) => (
                  <div key={label} className={`admin-dash-card admin-dash-card-soft admin-dash-tone-${tone}`}>
                    <div className="admin-dash-card-top">
                      <div className="admin-dash-icon-bubble">
                        <Icon size={18} />
                      </div>
                      <span className="admin-dash-card-label">{label}</span>
                    </div>
                    <div className="admin-dash-card-value">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    <div className="admin-dash-card-footer">
                      <span className="admin-dash-card-hint">Available credits</span>
                      <button
                        className="admin-dash-link"
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                      >
                        Create campaign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-dash-section">
              <div className="admin-dash-section-head">
                <div>
                  <h2 className="admin-dash-section-title">Campaign Health</h2>
                  <p className="admin-dash-section-sub">Monitor running, pending, and lifetime campaigns.</p>
                </div>
                <Link href="/admin/reports/campaigns" className="admin-dash-link">
                  View reports
                </Link>
              </div>
              <div className="admin-dash-grid admin-dash-grid-4">
                {campaignCards.map(({ label, value, tone, icon: Icon, hint }) => (
                  <div key={label} className={`admin-dash-card admin-dash-card-solid admin-dash-tone-${tone}`}>
                    <div className="admin-dash-card-top">
                      <div className="admin-dash-icon-bubble">
                        <Icon size={18} />
                      </div>
                      <span className="admin-dash-card-label">{label}</span>
                    </div>
                    <div className="admin-dash-card-value">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    <div className="admin-dash-card-footer">
                      <span className="admin-dash-card-hint">{hint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} aria-hidden />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Create Campaign</h3>
            <p className="text-zinc-600 text-sm mb-6">Enter the number to start a campaign.</p>
            <input
              type="text"
              value={number}
              onChange={e => setNumber(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 mb-4 text-sm"
              placeholder="Enter number"
              autoFocus
              disabled={saving}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium text-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCampaign}
                className="px-4 py-2 rounded-lg font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700"
                disabled={saving || !number}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSuccessModal(false)} aria-hidden />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Success</h3>
            <p className="text-zinc-600 text-sm mb-6">Campaign created successfully!</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
