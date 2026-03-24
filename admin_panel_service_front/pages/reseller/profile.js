import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ResellerLayout from '../../components/ResellerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { User, Mail, Shield, CreditCard, Eye, EyeOff, Lock, Save } from 'lucide-react';

export default function ResellerProfile() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'reseller')) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard') : '/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.users.update(user._id || user.id, { password: newPassword });
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fafc',
  };
  const eyeBtnStyle = {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0,
    display: 'flex', alignItems: 'center',
  };

  return (
    <ResellerLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My Profile</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Dashboard / Profile</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Account Info */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} /> Account Information
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
              {(user.email || 'R')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{user.email}</p>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: '#dbeafe', color: '#2563eb', textTransform: 'capitalize' }}>{user.role}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Shield, label: 'Role', value: 'Reseller' },
              { icon: CreditCard, label: 'Credits', value: (user.creditBalance ?? 0).toLocaleString() },
              { icon: User, label: 'Status', value: 'Active', valueColor: '#059669' },
            ].map(({ icon: Icon, label, value, valueColor }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="#64748b" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: valueColor || '#0f172a' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} /> Change Password
          </h2>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" style={{ ...inputStyle, paddingRight: 36 }} />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowNew((v) => !v)}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" style={{ ...inputStyle, paddingRight: 36 }} />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowConfirm((v) => !v)}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={saving || !newPassword || !confirmPassword}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: saving ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              <Save size={14} /> {saving ? 'Saving…' : 'Update Password'}
            </button>
          </form>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Security Tips</p>
            {['Use at least 8 characters', 'Mix letters, numbers, and symbols', 'Never share your password'].map((tip) => (
              <p key={tip} style={{ margin: '3px 0', fontSize: 12, color: '#94a3b8' }}>• {tip}</p>
            ))}
          </div>
        </div>
      </div>
    </ResellerLayout>
  );
}
