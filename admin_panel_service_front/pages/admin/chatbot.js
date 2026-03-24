import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useToast } from '../../contexts/ToastContext';
import { Bot, Plus, Trash2, Save } from 'lucide-react';

export default function AdminChatbot() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [rules, setRules] = useState([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.settings.getChatbot()
      .then((r) => {
        setEnabled(r.enabled ?? false);
        setWelcomeMessage(r.welcomeMessage ?? '');
        setFallbackMessage(r.fallbackMessage ?? '');
        setRules(Array.isArray(r.rules) ? r.rules : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const addRule = () => setRules((prev) => [...prev, { keyword: '', reply: '' }]);
  const removeRule = (i) => setRules((prev) => prev.filter((_, idx) => idx !== i));
  const updateRule = (i, field, val) => setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.settings.updateChatbot({ enabled, welcomeMessage, fallbackMessage, rules });
      toast.success('Chatbot settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  const taStyle = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' };
  const inputStyle = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={22} /> Chatbot
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>WhatsApp Bulk / Chatbot</p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Enable toggle */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Chatbot Status</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#94a3b8' }}>Enable automated keyword-based replies on WhatsApp</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div
                onClick={() => setEnabled((v) => !v)}
                style={{ width: 44, height: 24, borderRadius: 99, background: enabled ? '#059669' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <div style={{ position: 'absolute', top: 3, left: enabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: enabled ? '#059669' : '#94a3b8' }}>{enabled ? 'Active' : 'Disabled'}</span>
            </label>
          </div>

          {/* Messages */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Messages</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Welcome Message</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Sent when a user first messages. E.g., Hi! How can we help you?"
                  rows={4}
                  style={taStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Fallback Message</label>
                <textarea
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="Sent when no keyword matches. E.g., Sorry, I didn't understand that."
                  rows={4}
                  style={taStyle}
                />
              </div>
            </div>
          </div>

          {/* Keyword Rules */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Keyword Rules</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Auto-reply when a message contains a keyword</p>
              </div>
              <button type="button" onClick={addRule} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, color: '#2563eb', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <Plus size={13} /> Add Rule
              </button>
            </div>

            {rules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 13 }}>
                No keyword rules yet. Click "Add Rule" to create one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 36px', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Keyword</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reply</span>
                  <span />
                </div>
                {rules.map((rule, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 36px', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="e.g. price"
                      value={rule.keyword}
                      onChange={(e) => updateRule(i, 'keyword', e.target.value)}
                      style={inputStyle}
                      maxLength={100}
                    />
                    <input
                      type="text"
                      placeholder="e.g. Our price is ₹999/month"
                      value={rule.reply}
                      onChange={(e) => updateRule(i, 'reply', e.target.value)}
                      style={inputStyle}
                      maxLength={500}
                    />
                    <button type="button" onClick={() => removeRule(i)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#dc2626', flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: saving ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
