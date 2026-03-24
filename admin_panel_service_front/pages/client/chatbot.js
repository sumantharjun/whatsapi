import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClientLayout from '../../components/ClientLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Bot, Plus, Trash2, Save, Info } from 'lucide-react';

const s = {
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' },
};

export default function ChatbotPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [rules, setRules] = useState([]); // [{ keyword, reply }]

  useEffect(() => {
    if (!authLoading && (!user || !['client', 'reseller'].includes(user.role))) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/login') : '/login');
      return;
    }
    if (!user) return;
    api.settings.getChatbot()
      .then((data) => {
        setConfig(data);
        setEnabled(data?.enabled ?? false);
        setWelcomeMessage(data?.welcomeMessage || '');
        setFallbackMessage(data?.fallbackMessage || '');
        setRules(Array.isArray(data?.rules) ? data.rules : []);
      })
      .catch(() => { setRules([]); })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  const addRule = () => setRules((prev) => [...prev, { keyword: '', reply: '' }]);

  const updateRule = (i, field, val) => setRules((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const removeRule = (i) => setRules((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async (e) => {
    e.preventDefault();
    const emptyRule = rules.find((r) => !r.keyword.trim() || !r.reply.trim());
    if (emptyRule) { toast.error('Fill in all keyword and reply fields'); return; }
    setSaving(true);
    try {
      await api.settings.updateChatbot({ enabled, welcomeMessage: welcomeMessage.trim(), fallbackMessage: fallbackMessage.trim(), rules });
      toast.success('Chatbot settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientLayout>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={22} color="#2563eb" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Chatbot</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>Auto-reply rules for incoming WhatsApp messages.</p>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <form onSubmit={handleSave}>
            {/* Enable toggle */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Chatbot Status</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>Enable or disable auto-replies for all incoming messages.</p>
              </div>
              <button type="button" onClick={() => setEnabled((v) => !v)}
                style={{ padding: '8px 22px', borderRadius: 99, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: enabled ? '#059669' : '#e2e8f0', color: enabled ? '#fff' : '#64748b', transition: 'all 0.2s' }}>
                {enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Messages */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Default Messages</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={s.label}>Welcome Message <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(sent when someone messages for the first time)</span></label>
                  <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="e.g. Hello! Welcome to our service. How can we help you today?"
                    rows={3} style={{ ...s.input, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={s.label}>Fallback Message <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(sent when no keyword matches)</span></label>
                  <textarea value={fallbackMessage} onChange={(e) => setFallbackMessage(e.target.value)}
                    placeholder="e.g. Sorry, I didn't understand that. Please contact support."
                    rows={3} style={{ ...s.input, resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Keyword Rules */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Keyword Rules</h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>When a message contains the keyword, send the reply automatically.</p>
                </div>
                <button type="button" onClick={addRule}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <Plus size={14} /> Add Rule
                </button>
              </div>

              {rules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 14 }}>
                  <Bot size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>No rules yet. Click "Add Rule" to create your first auto-reply.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rules.map((rule, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, alignItems: 'flex-start', background: '#f8fafc', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div>
                        <label style={{ ...s.label, marginBottom: 4 }}>Keyword</label>
                        <input type="text" value={rule.keyword} onChange={(e) => updateRule(i, 'keyword', e.target.value)}
                          placeholder="e.g. hello, price, help" style={s.input} />
                      </div>
                      <div>
                        <label style={{ ...s.label, marginBottom: 4 }}>Reply</label>
                        <input type="text" value={rule.reply} onChange={(e) => updateRule(i, 'reply', e.target.value)}
                          placeholder="e.g. Hi! Our pricing starts at ₹999/month." style={s.input} />
                      </div>
                      <div style={{ paddingTop: 22 }}>
                        <button type="button" onClick={() => removeRule(i)}
                          style={{ padding: '9px 10px', border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#0369a1' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0 }}>Keywords are case-insensitive. If a message contains the keyword anywhere, the reply is sent. The welcome message is sent only once per new contact.</p>
            </div>

            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', border: 'none', borderRadius: 9, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save Chatbot Settings'}
            </button>
          </form>
        )}
      </div>
    </ClientLayout>
  );
}
