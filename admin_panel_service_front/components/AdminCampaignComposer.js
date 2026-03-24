import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseNumbers(text, countryCode = '') {
  if (!text.trim()) return { total: 0, valid: 0, invalid: 0, duplicate: 0, phones: [] };
  const cc = (countryCode || '').replace(/\D/g, '');
  const lines = text.trim().split(/\n/).filter(Boolean);
  const seen = new Set();
  let valid = 0, invalid = 0, duplicate = 0;
  const phones = [];
  for (const line of lines) {
    let phone = String(line.split(/[,\t]/)[0] || '').replace(/\D/g, '');
    // Auto-prepend country code if number is short (10 digits) and country code is set
    if (cc && phone.length === 10) phone = cc + phone;
    const ok = phone.length >= 10 && phone.length <= 15;
    if (seen.has(phone)) { duplicate++; continue; }
    seen.add(phone);
    if (ok) { valid++; phones.push(phone); } else { invalid++; }
  }
  return { total: lines.length, valid, invalid, duplicate, phones };
}

// Debounce hook — delays expensive computation until typing stops
function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const STATUS_COLOR = { ready: '#10b981', loading: '#f59e0b', qr: '#3b82f6', disconnected: '#ef4444' };
const STATUS_LABEL = { ready: 'Connected', loading: 'Starting…', qr: 'Scan QR', disconnected: 'Disconnected' };

// ── Corner Accounts Panel ─────────────────────────────────────────────────────

function AccountsPanel({ accounts, onAdd, onReconnect, onRemove, adding }) {
  const [open, setOpen] = useState(false);
  const readyCount = accounts.filter((a) => a.status === 'ready').length;
  const hasQR = accounts.some((a) => a.status === 'qr');

  const btnColor = readyCount > 0 ? '#10b981' : hasQR ? '#3b82f6' : '#f59e0b';
  const btnLabel = readyCount > 0 ? `${readyCount} WA Connected` : hasQR ? 'Scan QR' : 'WA Starting…';

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: btnColor, color: '#fff', border: 'none',
          borderRadius: 999, padding: '10px 18px', cursor: 'pointer',
          fontWeight: 700, fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}
      >
        <span style={{ fontSize: 16 }}>📱</span>
        {btnLabel}
        <span style={{ marginLeft: 4, fontSize: 11 }}>{open ? '▼' : '▲'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 52, right: 0, width: 320,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>WhatsApp Accounts</span>
            <button type="button" onClick={onAdd} disabled={adding}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {adding ? '…' : '+ Add'}
            </button>
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {accounts.length === 0 && (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No accounts yet</div>
            )}
            {accounts.map((a) => (
              <div key={a.clientId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: STATUS_COLOR[a.status] || '#94a3b8', flexShrink: 0, display: 'inline-block' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label || a.clientId}</div>
                    <div style={{ fontSize: 11, color: STATUS_COLOR[a.status] || '#94a3b8' }}>
                      {STATUS_LABEL[a.status] || a.status}{a.phone ? ` · ${a.phone}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {a.status !== 'ready' && (
                      <button type="button" onClick={() => onReconnect(a.clientId)}
                        style={{ fontSize: 11, padding: '3px 8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
                        Reconnect
                      </button>
                    )}
                    <button type="button" onClick={() => onRemove(a.clientId)}
                      style={{ fontSize: 11, padding: '3px 8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>
                      Remove
                    </button>
                  </div>
                </div>
                {a.status === 'qr' && a.qr && (
                  <div style={{ padding: '0 14px 14px', textAlign: 'center' }}>
                    <img src={a.qr} alt="Scan QR" style={{ width: 200, height: 200, display: 'block', margin: '0 auto', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>WhatsApp → Linked Devices → Link a Device</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {readyCount > 0 && (
            <div style={{ padding: '8px 14px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              {readyCount} account{readyCount > 1 ? 's' : ''} active — round-robin sending enabled
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Send progress panel ───────────────────────────────────────────────────────

function SendProgress({ job, onCancel, onDone }) {
  const pct = job.total > 0 ? Math.round(((job.sent + job.failed) / job.total) * 100) : 0;
  const done = job.status === 'done' || job.status === 'cancelled';

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: '#1e293b' }}>
          {job.status === 'running' ? 'Sending messages…' : job.status === 'cancelled' ? 'Cancelled' : 'Completed'}
        </span>
        <span style={{ fontSize: 13, color: '#64748b' }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          height: '100%', borderRadius: 4, transition: 'width 0.4s', width: `${pct}%`,
          background: job.status === 'cancelled' ? '#f59e0b' : done ? '#10b981' : '#3b82f6',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>Total: <strong style={{ color: '#1e293b' }}>{job.total}</strong></span>
        <span style={{ fontSize: 13, color: '#10b981' }}>Sent: <strong>{job.sent}</strong></span>
        <span style={{ fontSize: 13, color: '#ef4444' }}>Failed: <strong>{job.failed}</strong></span>
        <span style={{ fontSize: 13, color: '#64748b' }}>Pending: <strong style={{ color: '#1e293b' }}>{Math.max(0, job.total - job.sent - job.failed)}</strong></span>
      </div>
      {job.errors?.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c', marginBottom: 6 }}>Failed numbers:</div>
          {job.errors.slice(0, 5).map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: '#dc2626' }}>{e.phone}: {e.error}</div>
          ))}
          {job.errors.length > 5 && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>…and {job.errors.length - 5} more</div>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        {job.status === 'running' && (
          <button type="button" onClick={onCancel}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', cursor: 'pointer', fontWeight: 600 }}>
            Stop
          </button>
        )}
        {done && (
          <button type="button" onClick={onDone}
            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', cursor: 'pointer', fontWeight: 600 }}>
            Send Another
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main composer ─────────────────────────────────────────────────────────────

export default function AdminCampaignComposer({ title, breadcrumb }) {
  const [campaignName, setCampaignName] = useState('');
  const [numbers, setNumbers] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [message, setMessage] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [media, setMedia] = useState(null); // { fileId, filename, previewUrl, mimetype, uploading, error }

  const [accounts, setAccounts] = useState([]);
  const [adding, setAdding] = useState(false);
  const [sending, setSending] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');

  const pollRef = useRef(null);
  const csvRef = useRef(null);

  // Debounce number parsing — avoids freezing on large pastes
  const debouncedNumbers = useDebounced(numbers, 250);
  const stats = useMemo(() => parseNumbers(debouncedNumbers, countryCode), [debouncedNumbers, countryCode]);

  // Poll accounts every 5s; pause when tab hidden
  const fetchAccounts = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    try {
      const data = await api.whatsapp.accounts();
      setAccounts(data?.accounts || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchAccounts();
    const t = setInterval(fetchAccounts, 5000);
    return () => clearInterval(t);
  }, [fetchAccounts]);

  // Poll job progress every 2s while running
  useEffect(() => {
    if (job?.status !== 'running') return;
    pollRef.current = setInterval(async () => {
      try {
        const updated = await api.whatsapp.jobStatus(job.id);
        setJob(updated);
        if (updated.status !== 'running') {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [job?.id, job?.status]);

  const handleAddAccount = async () => {
    setAdding(true);
    try { await api.whatsapp.addAccount(); await fetchAccounts(); } catch { /* ignore */ } finally { setAdding(false); }
  };

  const handleReconnect = async (clientId) => {
    try { await api.whatsapp.reconnect(clientId); await fetchAccounts(); } catch { /* ignore */ }
  };

  const handleRemoveAccount = async (clientId) => {
    try { await api.whatsapp.removeAccount(clientId); await fetchAccounts(); } catch { /* ignore */ }
  };

  const handleSend = async () => {
    setError('');
    if (!message.trim() && !media?.fileId) { setError('Please enter a message or upload a media file.'); return; }
    if (stats.valid === 0) { setError('No valid phone numbers found.'); return; }
    if (media?.uploading) { setError('Please wait for the file to finish uploading.'); return; }
    setSending(true);
    try {
      const result = await api.whatsapp.sendBulk(stats.phones, message.trim(), undefined, media?.fileId || undefined);
      setJob({ id: result.jobId, total: result.total, sent: 0, failed: 0, status: 'running', errors: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    try { await api.whatsapp.cancelJob(job.id); } catch { /* ignore */ }
    setJob((j) => j ? { ...j, status: 'cancelled' } : j);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleReset = () => {
    setJob(null); setCampaignName(''); setNumbers('');
    setMessage(''); setAccepted(false); setError(''); setMedia(null); setCountryCode('91');
  };

  const handleMediaUpload = async (file, maxMB) => {
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) { setError(`File too large. Max ${maxMB} MB allowed.`); return; }
    if (media?.fileId) api.whatsapp.deleteMedia(media.fileId).catch(() => {});
    setMedia({ filename: file.name, mimetype: file.type, uploading: true, fileId: null, previewUrl: null, error: null });
    try {
      const result = await api.whatsapp.uploadMedia(file);
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      setMedia({ fileId: result.fileId, filename: file.name, mimetype: file.type, previewUrl, uploading: false, error: null });
    } catch (err) {
      setMedia((m) => ({ ...m, uploading: false, error: err.message }));
    }
  };

  const handleRemoveMedia = () => {
    if (media?.fileId) api.whatsapp.deleteMedia(media.fileId).catch(() => {});
    if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);
    setMedia(null);
  };

  const handleGenerate = () => {
    const text = 'Hi, we have a special offer for you. Reply YES to know more.';
    setMessage((prev) => (prev ? `${prev}\n\n${text}` : text));
  };

  const handleCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target.result || '').split(/\r?\n/).filter(Boolean);
      const phones = lines
        .map((line) => line.split(/,|\t/)[0].replace(/^["']|["']$/g, '').trim().replace(/\D/g, ''))
        .filter((n) => n.length >= 10 && n.length <= 15);
      setNumbers((prev) => prev ? prev + '\n' + phones.join('\n') : phones.join('\n'));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const canSend = accepted && !!campaignName && !sending && !job;

  return (
    <>
      <div className="admin-campaign-shell">
        <div className="admin-campaign-topbar">
          <div className="admin-campaign-credit"><span>Credit</span><strong>--</strong></div>
          <div className="admin-campaign-credit"><span>Wapp</span><strong>--</strong></div>
          <div className="admin-campaign-topbar-links">Dashboard / Profile</div>
        </div>

        <div className="admin-campaign-header">
          <div><h1>{title}</h1><p>{breadcrumb}</p></div>
        </div>

        <div className="admin-campaign-card">
          {job ? (
            <SendProgress job={job} onCancel={handleCancel} onDone={handleReset} />
          ) : (
            <>
              <div className="admin-campaign-row">
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Campaign Name"
                  className="admin-campaign-input"
                />
                <div className="admin-campaign-stats">
                  <span className="admin-campaign-stat admin-campaign-stat-slate">Total - {stats.total}</span>
                  <span className="admin-campaign-stat admin-campaign-stat-green">Valid - {stats.valid}</span>
                  <span className="admin-campaign-stat admin-campaign-stat-red">Invalid - {stats.invalid}</span>
                  <span className="admin-campaign-stat admin-campaign-stat-blue">Duplicate - {stats.duplicate}</span>
                </div>
              </div>

              <div className="admin-campaign-grid">
                {/* Left: Numbers */}
                <div className="admin-campaign-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ margin: 0 }}>Numbers *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => csvRef.current?.click()}
                        style={{ fontSize: 12, padding: '4px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                        Upload CSV / TXT
                      </button>
                      {numbers && (
                        <button type="button" onClick={() => setNumbers('')}
                          style={{ fontSize: 12, padding: '4px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          Clear
                        </button>
                      )}
                    </div>
                    <input ref={csvRef} type="file" accept=".csv,.txt,.xls,.xlsx" style={{ display: 'none' }} onChange={handleCSV} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#334155', fontWeight: 600, letterSpacing: '0.01em' }}>Auto country code</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid rgba(148, 163, 184, 0.7)', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: 'inset 0 1px 1px rgba(15, 23, 42, 0.04)' }}>
                      <span style={{ padding: '6px 10px', background: '#f8fafc', fontSize: 13, color: '#64748b', borderRight: '1px solid rgba(148, 163, 184, 0.6)', fontWeight: 700 }}>+</span>
                      <input
                        type="text"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="91"
                        style={{ width: 64, padding: '6px 10px', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: '#0f172a' }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Auto-added to 10-digit numbers (India=91, US=1)</span>
                  </div>
                  <textarea
                    rows={15}
                    value={numbers}
                    onChange={(e) => setNumbers(e.target.value)}
                    placeholder={'8084489133\n9546251027\n8618946980\n\nJust paste 10-digit numbers — country code added automatically\nOr upload CSV for 1000+ numbers'}
                  />
                </div>

                {/* Right: Message + Media */}
                <div className="admin-campaign-panel">
                  <div className="admin-campaign-message-head">
                    <label>Message</label>
                    <div className="admin-campaign-message-actions">
                      <span className="admin-campaign-limit">Demo Limit: 2 Demos / Day</span>
                      <button type="button" className="admin-campaign-ai-btn" onClick={handleGenerate}>
                        Generate With AI
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here…"
                  />

                  {/* Media */}
                  {media ? (
                    <div style={{ marginTop: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {media.uploading && <span style={{ fontSize: 12, color: '#3b82f6' }}>Uploading…</span>}
                        {media.error && <span style={{ fontSize: 12, color: '#ef4444' }}>{media.error}</span>}
                        {!media.uploading && !media.error && (
                          <>
                            {media.previewUrl
                              ? <img src={media.previewUrl} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0', flexShrink: 0 }} />
                              : (
                                <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', borderRadius: 6, fontSize: 22, flexShrink: 0 }}>
                                  {media.mimetype?.startsWith('video/') ? '🎬' : '📄'}
                                </div>
                              )
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.filename}</div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Ready to send with message</div>
                            </div>
                          </>
                        )}
                        <button type="button" onClick={handleRemoveMedia}
                          style={{ fontSize: 11, padding: '4px 10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Attach Media (optional)</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 12, padding: '6px 14px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          🖼 Image (≤16MB)
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={(e) => { handleMediaUpload(e.target.files?.[0], 16); e.target.value = ''; }} />
                        </label>
                        <label style={{ fontSize: 12, padding: '6px 14px', background: '#fdf4ff', color: '#9333ea', border: '1px solid #e9d5ff', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          📄 PDF (≤16MB)
                          <input type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                            onChange={(e) => { handleMediaUpload(e.target.files?.[0], 16); e.target.value = ''; }} />
                        </label>
                        <label style={{ fontSize: 12, padding: '6px 14px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          🎬 Video (≤16MB)
                          <input type="file" accept="video/*" style={{ display: 'none' }}
                            onChange={(e) => { handleMediaUpload(e.target.files?.[0], 16); e.target.value = ''; }} />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="admin-campaign-terms">
                    <p>
                      You will not use this panel for any form of spam activity, including deceptive, misleading,
                      fraudulent, offensive, harassing, or threatening messages. You are solely responsible for the
                      content of all messages sent through this panel.
                    </p>
                    <label className="admin-campaign-terms-check">
                      <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                      I Accept &amp; Agree!
                    </label>
                  </div>

                  {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#dc2626', fontSize: 13 }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    className="admin-campaign-send"
                    disabled={!canSend}
                    onClick={handleSend}
                  >
                    {sending ? 'Starting…' : `Send Now (${stats.valid} numbers)`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AccountsPanel
        accounts={accounts}
        onAdd={handleAddAccount}
        onReconnect={handleReconnect}
        onRemove={handleRemoveAccount}
        adding={adding}
      />
    </>
  );
}
