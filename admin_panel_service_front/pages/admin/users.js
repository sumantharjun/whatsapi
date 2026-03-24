import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

function EditModal({ user, onClose, onSaved }) {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {};
      if (email !== user.email) body.email = email;
      if (password) body.password = password;
      if (!Object.keys(body).length) { onClose(); return; }
      await api.users.update(user._id, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Edit User</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>{user.email}</p>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>New Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave blank to keep current)</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 7, background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('client');
  const [regLoading, setRegLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const load = async () => {
    try {
      const r = await api.users.list();
      setUsers(r.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      await api.auth.register({ email: regEmail, password: regPassword, role: regRole });
      setRegEmail('');
      setRegPassword('');
      setShowRegister(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleToggleActive = async (u) => {
    setTogglingId(u._id);
    try {
      const r = await api.users.toggleActive(u._id);
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isActive: r.user.isActive } : x));
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  const onSearch = (e) => { e.preventDefault(); };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    load();
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const filtered = users.filter((u) => {
    const q = (companyName + userName + mobileNumber).trim().toLowerCase();
    if (!q) return true;
    return u.email?.toLowerCase().includes(q);
  });

  const stats = [
    { label: 'Wapp', value: '32408' },
    { label: 'Wapp BTN', value: '4687.00' },
    { label: 'Wapi', value: '2' },
  ];

  return (
    <AdminLayout>
      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={load}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          <div style={{ background: '#1ea7d8', color: '#fff', padding: '10px 18px', fontWeight: 600 }}>Credit</div>
          <div style={{ background: 'linear-gradient(90deg,#3f3aa8,#4541c3)', color: '#fff', padding: '10px 18px', display: 'flex', gap: 24 }}>
            {stats.map((s) => (
              <span key={s.label} style={{ fontWeight: 600 }}>{s.label} : {s.value}</span>
            ))}
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Dashboard&nbsp; / &nbsp;<span style={{ color: '#64748b' }}>Manage User</span></div>
      </div>

      <form onSubmit={onSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20, alignItems: 'center', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16, marginBottom: 22 }}>
        <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }} />
        <input type="text" placeholder="User name" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }} />
        <input type="text" placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }} />
        <button type="submit" style={{ background: '#3f3aa8', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
          Search
        </button>
      </form>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 18, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
        <button
          type="button"
          onClick={() => setShowRegister(!showRegister)}
          style={{ background: '#3f3aa8', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
        >
          {showRegister ? 'Cancel' : 'Add User'}
        </button>

        {showRegister && (
          <form onSubmit={onRegister} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
            <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <input type="password" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
            <select value={regRole} onChange={(e) => setRegRole(e.target.value)} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}>
              <option value="reseller">Reseller</option>
              <option value="client">Client</option>
            </select>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={regLoading} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>
                {regLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>S.No.</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Name</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Email</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Reseller</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>User Type</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Credits</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#334155' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '16px 12px' }}>
                      <EmptyState message="No users yet." />
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, index) => {
                    const isActive = u.isActive !== false;
                    const toggling = togglingId === u._id;
                    return (
                      <tr key={u._id || u.email} style={{ borderBottom: '1px solid #eef2f7' }}>
                        <td style={{ padding: '12px 14px', fontSize: 14, color: '#0f172a' }}>{index + 1}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, color: '#0f172a' }}>{u.email?.split('@')[0] || '-'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{u.email || '-'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{u.resellerId || '-'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: u.role === 'reseller' ? '#eff6ff' : u.role === 'admin' ? '#fef3c7' : '#f0fdf4', color: u.role === 'reseller' ? '#2563eb' : u.role === 'admin' ? '#d97706' : '#16a34a' }}>
                            {u.role ? u.role[0].toUpperCase() + u.role.slice(1) : '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 14, color: '#059669', fontWeight: 600 }}>{u.creditBalance ?? 0}</td>
                        <td style={{ padding: '12px 14px', fontSize: 14, color: '#475569' }}>{u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '-'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#16a34a' : '#dc2626' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              disabled={toggling || u.role === 'admin'}
                              onClick={() => handleToggleActive(u)}
                              style={{ background: isActive ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: u.role === 'admin' ? 'not-allowed' : 'pointer', fontSize: 12, opacity: toggling ? 0.6 : 1, whiteSpace: 'nowrap' }}
                            >
                              {toggling ? '...' : isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditUser(u)}
                              style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
