import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useToast } from '../../contexts/ToastContext';

const CLIENT_SECTIONS = [
  { key: 'campaign', label: 'Campaign (Normal / Button / DP)' },
  { key: 'action_button', label: 'Action Button' },
  { key: 'button_sms', label: 'Button SMS' },
  { key: 'api', label: 'API' },
  { key: 'chatbot', label: 'Chatbot' },
  { key: 'whatsapp_report', label: 'WhatsApp Report' },
  { key: 'my_campaigns', label: "My User's Campaigns" },
  { key: 'credits', label: 'Credits' },
  { key: 'demo_requests', label: 'Demo Requests' },
];
const RESELLER_SECTIONS = [
  { key: 'clients', label: 'Clients' },
  { key: 'assign_credits', label: 'Assign Credits' },
  { key: 'campaigns', label: "User's Campaigns" },
  { key: 'analytics', label: 'Analytics' },
  { key: 'api', label: 'API' },
  { key: 'demo_requests', label: 'Demo Requests' },
];
const SECTIONS_BY_ROLE = { client: CLIENT_SECTIONS, reseller: RESELLER_SECTIONS };

function UserAccessRow({ u, onSave }) {
  const sections = SECTIONS_BY_ROLE[u.role] || [];
  const [allAccess, setAllAccess] = useState(!Array.isArray(u.enabledSections));
  const [enabled, setEnabled] = useState(
    Array.isArray(u.enabledSections) ? u.enabledSections : sections.map((s) => s.key)
  );
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setEnabled((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(u._id, allAccess ? null : enabled);
    setSaving(false);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{u.email}</span>
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: u.role === 'reseller' ? '#eff6ff' : '#f0fdf4', color: u.role === 'reseller' ? '#2563eb' : '#16a34a' }}>
            {u.role}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
            <input type="checkbox" checked={allAccess} onChange={(e) => { setAllAccess(e.target.checked); if (e.target.checked) setEnabled(sections.map((s) => s.key)); }} style={{ width: 15, height: 15 }} />
            All Access
          </label>
          <button type="button" disabled={saving} onClick={handleSave}
            style={{ padding: '6px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {sections.map(({ key, label }) => {
          const checked = allAccess || enabled.includes(key);
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: allAccess ? 'default' : 'pointer', padding: '4px 10px', borderRadius: 8, background: checked ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${checked ? '#93c5fd' : '#e2e8f0'}`, color: checked ? '#1d4ed8' : '#64748b', fontWeight: checked ? 600 : 400, opacity: allAccess ? 0.6 : 1 }}>
              <input type="checkbox" checked={checked} disabled={allAccess} onChange={() => toggle(key)} style={{ width: 13, height: 13 }} />
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

const cardStyle = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
const btnPrimary = { background: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' };

export default function AdminAccess() {
  const [pageTab, setPageTab] = useState('users'); // 'users' | 'sections'
  const [sectionTab, setSectionTab] = useState('client');
  const [sectionSearch, setSectionSearch] = useState('');
  const [resellers, setResellers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddReseller, setShowAddReseller] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reseller');
  const [resellerId, setResellerId] = useState('');
  const [grantUserId, setGrantUserId] = useState('');
  const [grantAmount, setGrantAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [granting, setGranting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.users.list({ role: 'reseller' }).then((r) => setResellers(r.users || [])).catch(() => setResellers([])),
      api.users.list({ role: 'client' }).then((r) => setClients(r.users || [])).catch(() => setClients([])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    load();
  }, [user, authLoading, router]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.register({ email, password, role, resellerId: role === 'client' && resellerId ? resellerId : undefined });
      setEmail('');
      setPassword('');
      setResellerId('');
      setShowAddReseller(false);
      setShowAddClient(false);
      load();
      toast.success(role === 'reseller' ? 'Reseller created' : 'Client created');
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!grantUserId || !grantAmount || parseInt(grantAmount, 10) <= 0) {
      toast.error('Select user and enter amount');
      return;
    }
    setGranting(true);
    try {
      await api.credits.purchase(grantUserId, parseInt(grantAmount, 10));
      setGrantUserId('');
      setGrantAmount('');
      load();
      toast.success('Credits granted');
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setGranting(false);
    }
  };

  const handleSectionSave = async (userId, sections) => {
    try {
      await api.users.setSections(userId, sections);
      toast.success('Access updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;

  const allUsers = [...resellers, ...clients];
  const sectionFiltered = allUsers
    .filter((u) => u.role === sectionTab)
    .filter((u) => !sectionSearch.trim() || u.email.toLowerCase().includes(sectionSearch.trim().toLowerCase()));

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Access Management</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Manage users, grant credits, and control section access per user.</p>
      </div>

      {/* Page tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {[{ key: 'users', label: 'Users & Credits' }, { key: 'sections', label: 'Section Access Control' }].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setPageTab(key)}
            style={{ padding: '8px 22px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: 700, fontSize: 13, marginBottom: -2, background: pageTab === key ? '#2563eb' : '#f1f5f9', color: pageTab === key ? '#fff' : '#64748b' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Section Access Control tab */}
      {pageTab === 'sections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['client', 'reseller'].map((r) => (
                <button key={r} type="button" onClick={() => setSectionTab(r)}
                  style={{ padding: '6px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, textTransform: 'capitalize', background: sectionTab === r ? '#0f172a' : '#f1f5f9', color: sectionTab === r ? '#fff' : '#64748b' }}>
                  {r === 'client' ? 'Clients' : 'Resellers'} ({(r === 'client' ? clients : resellers).length})
                </button>
              ))}
            </div>
            <input type="text" value={sectionSearch} onChange={(e) => setSectionSearch(e.target.value)} placeholder="Search by email…"
              style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '7px 12px', fontSize: 13, width: 220 }} />
          </div>
          {loading ? <LoadingSpinner /> : sectionFiltered.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>No {sectionTab}s found.</p>
          ) : sectionFiltered.map((u) => (
            <UserAccessRow key={`${u._id}-${Array.isArray(u.enabledSections) ? u.enabledSections.join(',') : 'all'}`} u={u} onSave={handleSectionSave} />
          ))}
          <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
            <strong style={{ color: '#1e293b' }}>How it works:</strong> Check <em>All Access</em> to grant full panel access. Or select individual sections. Dashboard and Profile are always visible.
          </div>
        </div>
      )}

      {/* Users & Credits tab */}
      {pageTab === 'users' && loading ? (
        <LoadingSpinner />
      ) : pageTab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {/* Resellers */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Resellers</h2>
              <button type="button" onClick={() => { setRole('reseller'); setShowAddReseller(true); setShowAddClient(false); }} style={btnPrimary}>+ Add Reseller</button>
            </div>
            <div style={{ padding: 20 }}>
              {showAddReseller && (
                <form onSubmit={handleCreateUser} style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
                  <div style={{ position: 'relative', marginTop: 8 }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 36 }} required />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <input type="hidden" value="reseller" />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={submitting} style={btnPrimary}>Create</button>
                    <button type="button" onClick={() => setShowAddReseller(false)} style={btnSecondary}>Cancel</button>
                  </div>
                </form>
              )}
              {resellers.length === 0 ? <EmptyState message="No resellers. Add one to give them access." /> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0', color: '#64748b', fontWeight: 600 }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '10px 0', color: '#64748b', fontWeight: 600 }}>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resellers.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 0', color: '#0f172a' }}>{u.email}</td>
                        <td style={{ padding: '12px 0', color: '#059669', fontWeight: 600 }}>{u.creditBalance ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Clients */}
          <div style={cardStyle}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Clients</h2>
              <button type="button" onClick={() => { setRole('client'); setShowAddClient(true); setShowAddReseller(false); }} style={btnPrimary}>+ Add Client</button>
            </div>
            <div style={{ padding: 20 }}>
              {showAddClient && (
                <form onSubmit={handleCreateUser} style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
                  <div style={{ position: 'relative', marginTop: 8 }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 36 }} required />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <select value={resellerId} onChange={(e) => setResellerId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} required>
                    <option value="">Select Reseller</option>
                    {resellers.map((r) => (
                      <option key={r._id} value={r._id}>{r.email}</option>
                    ))}
                  </select>
                  <input type="hidden" value="client" />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={submitting} style={btnPrimary}>Create</button>
                    <button type="button" onClick={() => setShowAddClient(false)} style={btnSecondary}>Cancel</button>
                  </div>
                </form>
              )}
              {clients.length === 0 ? <EmptyState message="No clients. Add one and assign a reseller." /> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0', color: '#64748b', fontWeight: 600 }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '10px 0', color: '#64748b', fontWeight: 600 }}>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 0', color: '#0f172a' }}>{u.email}</td>
                        <td style={{ padding: '12px 0', color: '#059669', fontWeight: 600 }}>{u.creditBalance ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grant credits — only on users tab */}
      {pageTab === 'users' && <div style={{ ...cardStyle, marginTop: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Grant Credits</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Grant credits to a reseller or client. They can then run campaigns.</p>
        </div>
        <form onSubmit={handleGrant} style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>User</label>
            <select value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} style={{ ...inputStyle, minWidth: 220 }} required>
              <option value="">Select user</option>
              {resellers.map((r) => (
                <option key={r._id} value={r._id}>{r.email} (Reseller)</option>
              ))}
              {clients.map((c) => (
                <option key={c._id} value={c._id}>{c.email} (Client)</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>Amount</label>
            <input type="number" min="1" placeholder="Credits" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} style={{ ...inputStyle, minWidth: 100 }} required />
          </div>
          <button type="submit" disabled={granting} style={btnPrimary}>Grant Credits</button>
        </form>
      </div>}
    </AdminLayout>
  );
}
