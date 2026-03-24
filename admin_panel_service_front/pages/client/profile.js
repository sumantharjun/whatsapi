import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Mail, Shield, CreditCard, Key, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';

const s = {
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  cardHead: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 },
  cardBody: { padding: '20px' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btn: { padding: '9px 22px', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
};

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color="#64748b" />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{value}</p>
      </div>
    </div>
  );
}

function CreditBadge({ label, value, color }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color }}>{value ?? 0}</p>
    </div>
  );
}

export default function ClientProfile() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['client', 'reseller'].includes(user.role))) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/login') : '/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.users.update(user._id, { password: newPassword });
      toast.success('Password changed successfully');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Profile</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Manage your account details and security.</p>
          </div>
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Account Info */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="#2563eb" />
                </div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Account Info</h2>
              </div>
              <div style={{ ...s.cardBody, paddingTop: 8, paddingBottom: 8 }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800 }}>
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{user.email.split('@')[0]}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{user.email}</p>
                  </div>
                </div>
                <InfoRow label="Email" value={user.email} icon={Mail} />
                <InfoRow label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} icon={Shield} />
                <InfoRow label="Member Since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} icon={Key} />
              </div>
            </div>

            {/* Credit Balances */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={16} color="#059669" />
                </div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Credit Balances</h2>
              </div>
              <div style={{ ...s.cardBody }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <CreditBadge label="Normal" value={user.creditBalance} color="#2563eb" />
                  <CreditBadge label="R-Btn" value={user.rBtnCredit} color="#7c3aed" />
                  <CreditBadge label="Action Btn" value={user.actionBtnCredit} color="#059669" />
                  <CreditBadge label="Btn-SMS" value={user.btnSmsCredit} color="#d97706" />
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Change Password */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={16} color="#d97706" />
              </div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Change Password</h2>
            </div>
            <div style={s.cardBody}>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={s.label}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters" style={{ ...s.input, paddingRight: 38 }} required />
                    <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={s.label}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password" style={{ ...s.input, paddingRight: 38 }} required />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ margin: 0, fontSize: 12, color: '#dc2626' }}>Passwords do not match</p>
                )}
                <button type="submit" disabled={saving || (newPassword && confirmPassword && newPassword !== confirmPassword)}
                  style={{ ...s.btn, background: '#d97706', color: '#fff', opacity: saving ? 0.7 : 1, marginTop: 4 }}>
                  {saving ? 'Saving…' : 'Update Password'}
                </button>
              </form>

              <div style={{ marginTop: 24, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Security tips</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
                  <li>Use at least 8 characters</li>
                  <li>Mix letters, numbers, and symbols</li>
                  <li>Don't reuse passwords from other sites</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </ClientLayout>
  );
}
