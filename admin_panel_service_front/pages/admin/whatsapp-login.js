import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STATUS_DOT   = { ready: '#10b981', loading: '#f59e0b', qr: '#3b82f6', pairing: '#8b5cf6', disconnected: '#ef4444' };
const STATUS_LABEL = { ready: 'Connected', loading: 'Starting…', qr: 'Scan QR', pairing: 'Enter Code', disconnected: 'Disconnected' };
const STATUS_BORDER = { ready: '#bbf7d0', qr: '#bfdbfe', pairing: '#ddd6fe', loading: '#fde68a', disconnected: '#fecaca' };

function AccountCard({ a, onReconnect, onRemove, onPairingCode }) {
  const [phoneInput, setPhoneInput] = useState('');
  const [showPhone, setShowPhone]   = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleGetCode = async () => {
    const phone = phoneInput.trim();
    if (!phone) return;
    setRequesting(true);
    try {
      await onPairingCode(a.clientId, phone);
      setShowPhone(false);
      setPhoneInput('');
    } finally { setRequesting(false); }
  };

  const needsAuth = a.status === 'qr' || a.status === 'pairing' || a.status === 'loading';

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${STATUS_BORDER[a.status] || '#e2e8f0'}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Header row */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: STATUS_DOT[a.status] || '#94a3b8' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.label || a.clientId}
          </div>
          <div style={{ fontSize: 12, marginTop: 2, color: STATUS_DOT[a.status] || '#94a3b8', fontWeight: 600 }}>
            {STATUS_LABEL[a.status] || a.status}{a.phone ? ` · ${a.phone}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {a.status !== 'ready' && (
            <button onClick={() => onReconnect(a.clientId)} type="button"
              style={{ fontSize: 12, padding: '5px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, fontWeight: 600, cursor: 'pointer' }}>
              Reconnect
            </button>
          )}
          <button onClick={() => onRemove(a.clientId)} type="button"
            style={{ fontSize: 12, padding: '5px 12px', background: '#fff5f5', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, fontWeight: 600, cursor: 'pointer' }}>
            Remove
          </button>
        </div>
      </div>

      {/* QR Code */}
      {a.status === 'qr' && a.qr && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#64748b', margin: '12px 0' }}>
            📱 WhatsApp → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → Scan
          </p>
          <img src={a.qr} alt="QR Code"
            style={{ width: 200, height: 200, margin: '0 auto', display: 'block', borderRadius: 12, border: '2px solid #bfdbfe' }} />
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>QR refreshes every ~20s</p>
        </div>
      )}

      {/* QR generating */}
      {a.status === 'qr' && !a.qr && (
        <div style={{ padding: '20px 18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ width: 24, height: 24, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Generating QR code…</p>
        </div>
      )}

      {/* Pairing code */}
      {a.status === 'pairing' && a.pairingCode && (
        <div style={{ padding: '14px 18px 18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
            📱 WhatsApp → <strong>Linked Devices</strong> → <strong>Link with phone number</strong>
          </p>
          <div style={{ display: 'inline-block', background: '#f5f3ff', border: '2px solid #c4b5fd', borderRadius: 14, padding: '10px 24px', marginBottom: 10 }}>
            <span style={{ fontSize: 26, fontFamily: 'monospace', fontWeight: 800, letterSpacing: 7, color: '#6d28d9' }}>
              {a.pairingCode}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Enter this code on your phone</p>
        </div>
      )}

      {/* Loading */}
      {a.status === 'loading' && (
        <div style={{ padding: '20px 18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ width: 24, height: 24, border: '3px solid #fde68a', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Starting session…</p>
        </div>
      )}

      {/* Connected */}
      {a.status === 'ready' && (
        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#059669' }}>✅ Session saved — auto-reconnects on restart.</p>
        </div>
      )}

      {/* Phone number / pairing option */}
      {needsAuth && (
        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid #f1f5f9' }}>
          {!showPhone ? (
            <button onClick={() => setShowPhone(true)} type="button"
              style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              🔢 Use phone number instead of QR →
            </button>
          ) : (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                Phone number (country code, no + or spaces):
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="tel"
                  placeholder="e.g. 919876543210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGetCode()}
                  style={{ flex: 1, fontSize: 12, border: '1.5px solid #c4b5fd', borderRadius: 7, padding: '7px 10px', outline: 'none' }}
                />
                <button onClick={handleGetCode} disabled={requesting || !phoneInput.trim()} type="button"
                  style={{ padding: '7px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (requesting || !phoneInput.trim()) ? 0.6 : 1 }}>
                  {requesting ? '…' : 'Get Code'}
                </button>
                <button onClick={() => { setShowPhone(false); setPhoneInput(''); }} type="button"
                  style={{ padding: '7px 10px', background: '#f1f5f9', border: 'none', borderRadius: 7, fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WhatsAppLogin() {
  const [accounts, setAccounts] = useState([]);
  const [adding, setAdding]     = useState(false);
  const { user, loading: authLoading } = useAuth();
  const toast  = useToast();
  const router = useRouter();
  const esRef  = useRef(null);

  const connectSSE = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    const es = new EventSource(`${BASE_URL}/api/whatsapp/events?token=${token}`);
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'snapshot') setAccounts(data.accounts || []);
      } catch {}
    };
    es.onerror = () => { es.close(); esRef.current = null; setTimeout(connectSSE, 3000); };
  }, []);

  const fetchAccounts = useCallback(async () => {
    try { const d = await api.whatsapp.accounts(); setAccounts(d?.accounts || []); } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { router.replace('/login'); return; }
    if (!user) return;
    connectSSE();
    return () => { if (esRef.current) { esRef.current.close(); esRef.current = null; } };
  }, [user, authLoading, router, connectSSE]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await api.whatsapp.addAccount(`Account ${accounts.length + 1}`);
      toast.success('Account added — use QR or phone number to link');
      await fetchAccounts();
    } catch (err) { toast.error(err.message); }
    finally { setAdding(false); }
  };

  const handleReconnect = async (clientId) => {
    try { await api.whatsapp.reconnect(clientId); toast.success('Reconnecting…'); }
    catch (err) { toast.error(err.message); }
  };

  const handleRemove = async (clientId) => {
    try {
      await api.whatsapp.removeAccount(clientId);
      setAccounts((prev) => prev.filter((x) => x.clientId !== clientId));
      toast.success('Account removed');
    } catch (err) { toast.error(err.message); }
  };

  const handlePairingCode = async (clientId, phone) => {
    try {
      const { code } = await api.whatsapp.pairingCode(clientId, phone);
      toast.success(`Pairing code: ${code} — enter it on WhatsApp`);
    } catch (err) { toast.error(err.message); }
  };

  if (authLoading || !user) return null;

  const readyCount = accounts.filter((a) => a.status === 'ready').length;

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>WhatsApp Accounts</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Manage linked accounts for bulk messaging</p>
        </div>
        <button onClick={handleAdd} disabled={adding} type="button"
          style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}>
          {adding ? 'Adding…' : '+ Add Account'}
        </button>
      </div>

      {/* Connected banner */}
      {readyCount > 0 && (
        <div style={{ marginBottom: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#166534', fontWeight: 600 }}>
          ✅ {readyCount} account{readyCount > 1 ? 's' : ''} connected — round-robin sending active
        </div>
      )}

      {/* Account grid */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {accounts.map((a) => (
          <AccountCard key={a.clientId} a={a}
            onReconnect={handleReconnect}
            onRemove={handleRemove}
            onPairingCode={handlePairingCode}
          />
        ))}
        {accounts.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No accounts yet</div>
            <div style={{ fontSize: 13 }}>Click &ldquo;+ Add Account&rdquo; to link your first WhatsApp number</div>
          </div>
        )}
      </div>

      {/* Info box */}
      <div style={{ marginTop: 28, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 18px', fontSize: 13, color: '#92400e', maxWidth: 600 }}>
        <strong>Two ways to link:</strong> Scan the QR code <em>or</em> click &ldquo;Use phone number instead of QR&rdquo; to get an 8-digit code — no camera needed. Sessions save automatically.
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </AdminLayout>
  );
}
