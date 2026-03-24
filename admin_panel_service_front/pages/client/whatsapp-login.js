import { useCallback, useEffect, useRef, useState } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STATUS_DOT  = { ready: '#059669', qr: '#3b82f6', pairing: '#7c3aed', loading: '#f59e0b', disconnected: '#ef4444' };
const STATUS_TEXT = { ready: '#059669', qr: '#2563eb', pairing: '#7c3aed', loading: '#d97706', disconnected: '#dc2626' };
const STATUS_GLOW = { ready: '#bbf7d0', qr: '#bfdbfe', pairing: '#ddd6fe', loading: 'none', disconnected: 'none' };
const STATUS_BORDER = { ready: '#bbf7d0', qr: '#bfdbfe', pairing: '#ddd6fe', loading: '#fde68a', disconnected: '#fecaca' };
const STATUS_LABEL = {
  ready:        'Connected',
  qr:           'Waiting for scan…',
  pairing:      'Enter pairing code on phone',
  loading:      'Starting…',
  disconnected: 'Disconnected',
};

export default function ClientWhatsAppLogin() {
  const [session, setSession]           = useState(null);
  const [pageLoading, setPageLoading]   = useState(true);
  const [connecting, setConnecting]     = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [removing, setRemoving]         = useState(false);
  const [phoneInput, setPhoneInput]     = useState('');
  const [showPhone, setShowPhone]       = useState(false);
  const [gettingCode, setGettingCode]   = useState(false);

  const { user, loading: authLoading } = useAuth();
  const toast  = useToast();
  const router = useRouter();
  const esRef  = useRef(null);

  const connectSSE = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const es = new EventSource(`${BASE_URL}/api/whatsapp/my/events?token=${token}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'session') { setSession(data.session); setPageLoading(false); }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setPageLoading(false);
      setTimeout(connectSSE, 3000);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (!user) return;
    connectSSE();
    return () => { if (esRef.current) { esRef.current.close(); esRef.current = null; } };
  }, [user, authLoading, router, connectSSE]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await api.whatsapp.myConnect();
      toast.success('Session starting — QR will appear shortly');
    } catch (err) { toast.error(err.message); }
    finally { setConnecting(false); }
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      await api.whatsapp.myReconnect();
      toast.success('Reconnecting…');
    } catch (err) { toast.error(err.message); }
    finally { setReconnecting(false); }
  };

  const handleGetPairingCode = async () => {
    const phone = phoneInput.trim();
    if (!phone) return;
    setGettingCode(true);
    try {
      const { code } = await api.whatsapp.myPairingCode(phone);
      toast.success(`Code: ${code} — enter it on WhatsApp now`);
      setShowPhone(false);
      setPhoneInput('');
    } catch (err) { toast.error(err.message); }
    finally { setGettingCode(false); }
  };

  const handleRemove = async () => {
    if (!confirm('Remove your WhatsApp session?')) return;
    setRemoving(true);
    try {
      await api.whatsapp.myRemove();
      setSession(null);
      toast.success('Session removed');
    } catch (err) { toast.error(err.message); }
    finally { setRemoving(false); }
  };

  if (authLoading || !user) return null;

  const st = session?.status;
  const needsAuth = st === 'qr' || st === 'pairing' || st === 'loading';

  return (
    <ClientLayout>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>My WhatsApp</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Link your WhatsApp to send campaigns</p>
        </div>
        {session && (
          <button onClick={handleRemove} disabled={removing} type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #fecaca', borderRadius: 8, background: '#fff5f5', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: removing ? 0.6 : 1 }}>
            🗑 {removing ? 'Removing…' : 'Remove Session'}
          </button>
        )}
      </div>

      {/* Loading page spinner */}
      {pageLoading && (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      )}

      {/* No session yet */}
      {!pageLoading && !session && (
        <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
            📱
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Connect Your WhatsApp</h2>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
            Link your WhatsApp number to send campaigns from your own account. Your session is private — only you can see it.
          </p>
          <button onClick={handleConnect} disabled={connecting} type="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.7 : 1 }}>
            {connecting ? '⏳ Starting…' : '＋ Connect WhatsApp'}
          </button>
        </div>
      )}

      {/* Session card */}
      {!pageLoading && session && (
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <div style={{ background: '#fff', borderRadius: 20, border: `2px solid ${STATUS_BORDER[st] || '#e2e8f0'}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

            {/* Card header — status bar */}
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, background: st === 'ready' ? '#f0fdf4' : st === 'pairing' ? '#faf5ff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', flexShrink: 0, background: STATUS_DOT[st] || '#94a3b8', boxShadow: STATUS_GLOW[st] !== 'none' ? `0 0 0 3px ${STATUS_GLOW[st]}` : 'none' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>My WhatsApp Session</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: STATUS_TEXT[st] || '#64748b', marginTop: 2 }}>
                  {STATUS_LABEL[st] || st}
                  {st === 'ready' && session.phone ? ` · ${session.phone}` : ''}
                </div>
              </div>
            </div>

            {/* CONNECTED */}
            {st === 'ready' && (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28 }}>✅</div>
                <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#059669' }}>WhatsApp Connected!</p>
                <p style={{ margin: '0 0 22px', fontSize: 13, color: '#64748b' }}>Campaigns will send from your own number.</p>
                <button onClick={handleReconnect} disabled={reconnecting} type="button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🔄 {reconnecting ? 'Reconnecting…' : 'Force Reconnect'}
                </button>
              </div>
            )}

            {/* QR CODE */}
            {st === 'qr' && session.qr && (
              <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>
                  📱 WhatsApp → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → Scan
                </p>
                <img src={session.qr} alt="QR Code"
                  style={{ width: 220, height: 220, margin: '0 auto 14px', display: 'block', borderRadius: 14, border: '2px solid #bfdbfe' }} />
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>QR refreshes every ~20s</p>
              </div>
            )}

            {/* QR loading */}
            {st === 'qr' && !session.qr && (
              <div style={{ padding: 36, textAlign: 'center' }}>
                <div style={{ width: 30, height: 30, border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Generating QR code…</p>
              </div>
            )}

            {/* PAIRING CODE */}
            {st === 'pairing' && session.pairingCode && (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                  📱 WhatsApp → <strong>Linked Devices</strong> → <strong>Link with phone number</strong>
                </p>
                <div style={{ display: 'inline-block', background: '#f5f3ff', border: '2px solid #c4b5fd', borderRadius: 16, padding: '14px 32px', marginBottom: 14 }}>
                  <span style={{ fontSize: 30, fontFamily: 'monospace', fontWeight: 800, letterSpacing: 8, color: '#6d28d9' }}>
                    {session.pairingCode}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Enter this code on your phone → you'll be connected instantly</p>
              </div>
            )}

            {/* LOADING */}
            {st === 'loading' && (
              <div style={{ padding: 36, textAlign: 'center' }}>
                <div style={{ width: 30, height: 30, border: '3px solid #fde68a', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Starting session…</p>
              </div>
            )}

            {/* DISCONNECTED */}
            {st === 'disconnected' && (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28 }}>📵</div>
                <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Disconnected</p>
                <p style={{ margin: '0 0 22px', fontSize: 13, color: '#64748b' }}>Session lost — reconnect to link again</p>
                <button onClick={handleReconnect} disabled={reconnecting} type="button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: reconnecting ? 'not-allowed' : 'pointer', opacity: reconnecting ? 0.7 : 1 }}>
                  🔄 {reconnecting ? 'Reconnecting…' : 'Reconnect & Scan QR'}
                </button>
              </div>
            )}

            {/* Phone number / pairing code option — shown when auth is needed */}
            {needsAuth && (
              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #f1f5f9' }}>
                {!showPhone ? (
                  <button onClick={() => setShowPhone(true)} type="button"
                    style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                    🔢 Use phone number instead of QR →
                  </button>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                      Enter your WhatsApp number (with country code, no + or spaces):
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="tel"
                        placeholder="e.g. 919876543210"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGetPairingCode()}
                        style={{ flex: 1, fontSize: 13, border: '1.5px solid #c4b5fd', borderRadius: 8, padding: '8px 12px', outline: 'none', color: '#0f172a' }}
                      />
                      <button onClick={handleGetPairingCode} disabled={gettingCode || !phoneInput.trim()} type="button"
                        style={{ padding: '8px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (gettingCode || !phoneInput.trim()) ? 0.6 : 1 }}>
                        {gettingCode ? '…' : 'Get Code'}
                      </button>
                      <button onClick={() => { setShowPhone(false); setPhoneInput(''); }} type="button"
                        style={{ padding: '8px 10px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e' }}>
            <strong>Tip:</strong> Scan once — session saves automatically. Next server restart reconnects without a new QR.
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </ClientLayout>
  );
}
