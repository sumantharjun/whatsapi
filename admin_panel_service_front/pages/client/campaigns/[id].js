import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ClientLayout from '../../../components/ClientLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import StatusBadge from '../../../components/StatusBadge';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function CampaignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipientsText, setRecipientsText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [buttonQuestion, setButtonQuestion] = useState('');
  const [buttonOptions, setButtonOptions] = useState([]);
  const [savingButton, setSavingButton] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [generateAiLoading, setGenerateAiLoading] = useState(false);

  function parseNumbers(text) {
    const lines = text.trim().split(/\n/).filter(Boolean);
    const seen = new Set();
    let valid = 0, invalid = 0, duplicate = 0;
    const rows = lines.map((line) => {
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      const phone = String(parts[0] || '').replace(/\D/g, '');
      const name = (parts[1] || '').slice(0, 200);
      const ok = phone.length >= 10 && phone.length <= 15;
      if (seen.has(phone)) duplicate++;
      else if (ok) valid++;
      else invalid++;
      if (phone) seen.add(phone);
      return { phone, name, ok };
    });
    const total = rows.length;
    return { total, valid, invalid, duplicate, rows };
  }
  const numberStats = parseNumbers(recipientsText);
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!authLoading && (!user || !['client', 'reseller'].includes(user.role))) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/login') : '/login');
      return;
    }
    if (!id || !user) return;
    api.campaigns.get(id)
      .then((r) => {
        setCampaign(r.campaign);
        setMessageBody(r.campaign?.messageBody || '');
        if (r.campaign?.type === 'button') {
          setButtonQuestion(r.campaign.buttonQuestion || '');
          setButtonOptions(Array.isArray(r.campaign.buttonOptions) && r.campaign.buttonOptions.length ? [...r.campaign.buttonOptions] : ['']);
        }
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  const addOption = () => setButtonOptions((o) => [...o, '']);
  const setOption = (index, value) => setButtonOptions((o) => {
    const next = [...o];
    next[index] = value;
    return next;
  });
  const removeOption = (index) => setButtonOptions((o) => o.length > 1 ? o.filter((_, i) => i !== index) : ['']);

  const saveButtonPayload = async (e) => {
    e.preventDefault();
    setSavingButton(true);
    try {
      await api.campaigns.update(id, {
        name: campaign.name,
        messageBody: campaign.messageBody,
        type: 'button',
        buttonQuestion,
        buttonOptions: buttonOptions.filter(Boolean),
      });
      const r = await api.campaigns.get(id);
      setCampaign(r.campaign);
      toast.success('Button campaign updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingButton(false);
    }
  };

  const uploadRecipients = async (e) => {
    e.preventDefault();
    const { rows } = parseNumbers(recipientsText);
    const toSend = rows.filter((r) => r.ok && r.phone).map((r) => ({ phone: r.phone, name: r.name }));
    const uniquePhones = [...new Set(toSend.map((r) => r.phone))];
    const payload = uniquePhones.map((p) => {
      const row = toSend.find((r) => r.phone === p);
      return { phone: p, name: (row && row.name) || '' };
    });
    if (payload.length === 0) { toast.error('Enter at least one valid phone number'); return; }
    setUploading(true);
    try {
      await api.campaigns.addRecipients(id, payload);
      const r = await api.campaigns.get(id);
      setCampaign(r.campaign);
      setRecipientsText('');
      toast.success(`Added ${payload.length} recipient(s)`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateAi = async () => {
    setGenerateAiLoading(true);
    try {
      const { messageBody: generated } = await api.ai.generateMessage('');
      setMessageBody((prev) => prev + (prev ? '\n\n' : '') + (generated || 'Hi {{name}}, we have a special offer for you. Reply YES to know more.'));
      toast.success('Message generated. Generate FREE once per day.');
    } catch (e) {
      toast.error(e.message || 'Generate failed');
    } finally {
      setGenerateAiLoading(false);
    }
  };

  const saveMessageBody = async (e) => {
    e.preventDefault();
    setSavingMessage(true);
    try {
      await api.campaigns.update(id, { name: campaign.name, messageBody, type: campaign.type || 'text', buttonQuestion: campaign.type === 'button' ? buttonQuestion : undefined, buttonOptions: campaign.type === 'button' ? buttonOptions.filter(Boolean) : undefined });
      const r = await api.campaigns.get(id);
      setCampaign(r.campaign);
      toast.success('Message saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingMessage(false);
    }
  };

  const start = async () => {
    setStarting(true);
    try {
      await api.campaigns.start(id);
      const r = await api.campaigns.get(id);
      setCampaign(r.campaign);
      toast.success('Campaign started');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStarting(false);
    }
  };

  const resume = async () => {
    setStarting(true);
    try {
      await api.campaigns.start(id);
      const r = await api.campaigns.get(id);
      setCampaign(r.campaign);
      toast.success('Campaign resumed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStarting(false);
    }
  };

  if (authLoading || !user) return <LoadingSpinner />;
  if (loading && !campaign) return <ClientLayout><LoadingSpinner /></ClientLayout>;
  if (!campaign) return <ClientLayout><p className="text-zinc-600">Campaign not found.</p></ClientLayout>;

  return (
    <ClientLayout>
      <div className="mb-6">
        <Link href="/client/campaigns" className="text-slate-600 hover:text-slate-800 text-sm font-medium">← Back to campaigns</Link>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{campaign.name}</h1>
        <StatusBadge status={campaign.status} />
      </div>
      <p className="text-slate-500 text-sm mb-6">Recipients: {campaign.recipientCount ?? 0} · Sent: {campaign.sentCount ?? 0} · Failed: {campaign.failedCount ?? 0}{campaign.type === 'button' ? ` · Type: Button` : ''}</p>

      {/* ── Pause / Block Alert ─────────────────────────────────────── */}
      {campaign.status === 'paused' && campaign.pauseReason && (
        <div style={{
          background: campaign.pauseReason.startsWith('all_numbers_blocked') ? '#fef2f2' : '#fef3c7',
          border: `1px solid ${campaign.pauseReason.startsWith('all_numbers_blocked') ? '#fecaca' : '#f59e0b'}`,
          borderRadius: 10, padding: '16px 18px', marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>
              {campaign.pauseReason.startsWith('all_numbers_blocked') ? '🚫' : campaign.pauseReason.startsWith('manual_pause') ? '⏸' : '⚠️'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: campaign.pauseReason.startsWith('all_numbers_blocked') ? '#b91c1c' : '#92400e', fontSize: 15, marginBottom: 6 }}>
                {campaign.pauseReason.startsWith('all_numbers_blocked')
                  ? 'Campaign Auto-Paused — Sending Number Blocked'
                  : campaign.pauseReason.startsWith('manual_pause')
                  ? 'Campaign Paused Manually'
                  : 'Campaign Paused — Issue Detected'}
              </div>
              <div style={{ fontSize: 13, color: campaign.pauseReason.startsWith('all_numbers_blocked') ? '#dc2626' : '#78350f', lineHeight: 1.6 }}>
                {campaign.pauseReason.replace(/^[^—]*—\s*/, '') || campaign.pauseReason}
              </div>
              {campaign.pausedAt && (
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  Paused at: {new Date(campaign.pausedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              type="button"
              onClick={resume}
              disabled={starting}
              style={{
                background: campaign.pauseReason.startsWith('all_numbers_blocked') ? '#dc2626' : '#d97706',
                color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px',
                fontWeight: 700, fontSize: 13, cursor: starting ? 'not-allowed' : 'pointer', opacity: starting ? 0.6 : 1
              }}
            >
              {starting ? 'Resuming…' : '▶ Resume Campaign'}
            </button>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {campaign.pauseReason.startsWith('all_numbers_blocked')
                ? 'Ask your admin to unblock or add new virtual numbers before resuming.'
                : campaign.pauseReason.startsWith('manual_pause')
                ? 'Campaign will continue from where it left off.'
                : 'Check WhatsApp connections in the admin panel, then resume.'}
            </span>
          </div>
        </div>
      )}

      {/* Running / Completed progress summary */}
      {(campaign.status === 'running' || campaign.status === 'queued' || campaign.status === 'completed') && (
        <div style={{ background: campaign.status === 'completed' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${campaign.status === 'completed' ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#374151' }}>Sent: <strong style={{ color: '#16a34a' }}>{campaign.sentCount ?? 0}</strong></span>
            <span style={{ fontSize: 13, color: '#374151' }}>Failed: <strong style={{ color: '#dc2626' }}>{campaign.failedCount ?? 0}</strong></span>
            <span style={{ fontSize: 13, color: '#374151' }}>Pending: <strong>{Math.max(0, (campaign.recipientCount ?? 0) - (campaign.sentCount ?? 0) - (campaign.failedCount ?? 0))}</strong></span>
            {campaign.status === 'running' && <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>Sending…</span>}
            {campaign.status === 'completed' && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Completed</span>}
          </div>
        </div>
      )}

      {campaign.status === 'draft' && (
        <form onSubmit={saveMessageBody} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <p className="text-red-600 text-sm mb-2">Message: Demo Limit : 2 Demos / Day</p>
          <div className="relative">
            <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Type your message here..." className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows={4} />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Generate FREE Once in a Day</span>
              <button type="button" onClick={handleGenerateAi} disabled={generateAiLoading} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                {generateAiLoading ? '...' : '✨ Generate With AI'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={savingMessage} className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Save message</button>
        </form>
      )}
      {campaign.type === 'button' && campaign.status === 'draft' && (
        <form onSubmit={saveButtonPayload} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Interactive question & options</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
            <input value={buttonQuestion} onChange={(e) => setButtonQuestion(e.target.value)} placeholder="Ex. Are You Interested?" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Options</label>
              <button type="button" onClick={addOption} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Option</button>
            </div>
            {buttonOptions.map((opt, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder={i === 0 ? 'Yes' : `Option ${i + 1}`} value={opt} onChange={(e) => setOption(i, e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                <button type="button" onClick={() => removeOption(i)} className="text-slate-500 hover:text-red-600 px-2">×</button>
              </div>
            ))}
          </div>
          <button type="submit" disabled={savingButton} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Save question & options</button>
        </form>
      )}
      {campaign.status === 'draft' && (
        <>
          <form onSubmit={uploadRecipients} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">Numbers * (one per line or comma/tab: phone, name)</label>
            <textarea value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} placeholder="+911234567890, John&#10;+919876543210, Jane" className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows={6} />
            <div className="flex flex-wrap gap-3 mt-2 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-200 text-slate-800">Total - {numberStats.total}</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-200 text-emerald-800">Valid - {numberStats.valid}</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-200 text-red-800">Invalid - {numberStats.invalid}</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">Duplicate - {numberStats.duplicate}</span>
            </div>
            <button type="submit" disabled={uploading} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Upload</button>
          </form>
          {campaign.recipientCount > 0 && (
            <button type="button" onClick={start} disabled={starting} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-900/20">Start campaign</button>
          )}
        </>
      )}

      {/* Manual-paused campaign (no automatic reason) — show a plain Resume button */}
      {campaign.status === 'paused' && !campaign.pauseReason && (
        <>
          <p className="text-slate-500 text-sm mb-4">Campaign is paused. Resume to continue sending to remaining recipients.</p>
          <button type="button" onClick={resume} disabled={starting} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-900/20">
            {starting ? 'Resuming…' : 'Resume Campaign'}
          </button>
        </>
      )}
    </ClientLayout>
  );
}
