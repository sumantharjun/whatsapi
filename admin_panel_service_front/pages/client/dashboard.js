import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import {
  MessageCircle,
  Send,
  XCircle,
  CheckCircle2,
  Loader2,
  Clock,
  CreditCard,
  Zap,
  MousePointerClick,
  MessageSquare,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString();

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{fmt(value)}</p>
        {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{sub}</p>}
      </div>
    </div>
  );
}

function CreditCard2({ label, value, color, bg, icon: Icon, href }) {
  return (
    <Link href={href || '/client/credits'} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fff', border: `1.5px solid ${color}22`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'box-shadow 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={17} color={color} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmt(value)}</p>
          </div>
        </div>
        <ArrowRight size={15} color="#cbd5e1" />
      </div>
    </Link>
  );
}

function QuickAction({ label, href, icon: Icon, color }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
      >
        <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{label}</span>
        <ArrowRight size={14} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
      </div>
    </Link>
  );
}

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const d = await api.analytics.overview();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  if (authLoading || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <LoadingSpinner />
    </div>
  );

  const ov = data?.overview || {};
  const successRate = ov.totalSent > 0
    ? Math.round(((ov.totalSent - (ov.totalFailed || 0)) / ov.totalSent) * 100)
    : null;

  return (
    <ClientLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 4px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Here's what's happening with your campaigns today.</p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Main stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard icon={MessageCircle} label="Total Campaigns" value={ov.totalCampaigns} color="#2563eb" bg="#eff6ff"
                sub={`${ov.completed ?? 0} completed`} />
              <StatCard icon={Send} label="Messages Sent" value={ov.totalSent} color="#059669" bg="#dcfce7"
                sub={successRate !== null ? `${successRate}% success rate` : 'No sends yet'} />
              <StatCard icon={XCircle} label="Failed" value={ov.totalFailed} color="#dc2626" bg="#fee2e2"
                sub="Delivery failures" />
              <StatCard icon={Loader2} label="In Progress" value={ov.inProcess} color="#d97706" bg="#fef3c7"
                sub={`${ov.running ?? 0} running now`} />
              <StatCard icon={Clock} label="Pending / Draft" value={ov.pending} color="#7c3aed" bg="#f5f3ff"
                sub="Not started yet" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

              {/* Credits */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Credit Balances</h2>
                  <Link href="/client/credits" style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                  <CreditCard2 label="Normal Credit" value={data?.normalCredit} color="#2563eb" bg="#eff6ff" icon={CreditCard} href="/client/credits" />
                  <CreditCard2 label="R-Btn Credit" value={data?.rBtnCredit} color="#7c3aed" bg="#f5f3ff" icon={Zap} href="/client/credits" />
                  <CreditCard2 label="Action Btn" value={data?.actionBtnCredit} color="#059669" bg="#dcfce7" icon={MousePointerClick} href="/client/credits" />
                  <CreditCard2 label="Btn-SMS" value={data?.btnSmsCredit} color="#d97706" bg="#fef3c7" icon={MessageSquare} href="/client/credits" />
                </div>

                {/* Campaign status breakdown */}
                {(ov.totalCampaigns ?? 0) > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Campaign Status Breakdown</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Completed', value: ov.completed ?? 0, color: '#059669', bg: '#dcfce7', pct: ov.totalCampaigns },
                        { label: 'Running', value: ov.running ?? 0, color: '#2563eb', bg: '#eff6ff', pct: ov.totalCampaigns },
                        { label: 'In Queue', value: (ov.inProcess ?? 0) - (ov.running ?? 0), color: '#d97706', bg: '#fef3c7', pct: ov.totalCampaigns },
                        { label: 'Draft / Pending', value: ov.pending ?? 0, color: '#7c3aed', bg: '#f5f3ff', pct: ov.totalCampaigns },
                      ].map(({ label, value, color, bg, pct }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                            <span style={{ color: '#475569', fontWeight: 500 }}>{label}</span>
                            <span style={{ color, fontWeight: 700 }}>{value}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 99, background: color, width: `${pct > 0 ? Math.round((value / pct) * 100) : 0}%`, transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div>
                <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Quick Actions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <QuickAction label="New Campaign" href="/client/campaigns" icon={Send} color="#2563eb" />
                  <QuickAction label="Button Campaign" href="/client/campaigns?type=button" icon={MousePointerClick} color="#7c3aed" />
                  <QuickAction label="DP Campaign" href="/client/dp-campaign" icon={MessageCircle} color="#059669" />
                  <QuickAction label="Action Button" href="/client/action-button" icon={Zap} color="#d97706" />
                  <QuickAction label="Button SMS" href="/client/button-sms" icon={MessageSquare} color="#dc2626" />
                  <QuickAction label="WhatsApp Report" href="/client/whatsapp-report" icon={CheckCircle2} color="#0891b2" />
                  <QuickAction label="Request Demo Credits" href="/client/demo-requests" icon={CreditCard} color="#64748b" />
                </div>

                {/* Account info card */}
                <div style={{ marginTop: 16, background: '#0f172a', borderRadius: 12, padding: '16px 18px', color: '#fff' }}>
                  <p style={{ margin: '0 0 2px', fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logged in as</p>
                  <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, wordBreak: 'break-all' }}>{user.email}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, background: '#1e40af', color: '#bfdbfe', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </ClientLayout>
  );
}
