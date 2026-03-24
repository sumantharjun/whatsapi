const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(data.message || res.statusText || 'Request failed');
  }
  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/users/me'),
  },
  users: {
    me: () => request('/users/me'),
    list: (params) => request('/users?' + new URLSearchParams(params || {}).toString()),
    setSections: (id, sections) => request(`/users/${id}/sections`, { method: 'PUT', body: JSON.stringify({ sections }) }),
    toggleActive: (id) => request(`/users/${id}/toggle-active`, { method: 'PATCH', body: JSON.stringify({}) }),
    update: (id, body) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  credits: {
    purchase: (userId, amount) => request('/credits/purchase', { method: 'POST', body: JSON.stringify({ userId, amount }) }),
    history: (params) => request('/credits/history?' + new URLSearchParams(params || {}).toString()),
  },
  campaigns: {
    list: () => request('/campaigns'),
    get: (id) => request(`/campaigns/${id}`),
    create: (body) => request('/campaigns', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    addRecipients: (id, recipients) => request(`/campaigns/${id}/recipients`, { method: 'POST', body: JSON.stringify(Array.isArray(recipients) ? recipients : { recipients }) }),
    start: (id) => request(`/campaigns/${id}/start`, { method: 'POST', body: JSON.stringify({}) }),
    pause: (id) => request(`/campaigns/${id}/pause`, { method: 'POST' }),
    validateNumbers: (rows) => request('/campaigns/validate-numbers', { method: 'POST', body: JSON.stringify(Array.isArray(rows) ? rows : { numbers: rows }) }),
    exportUrl: (id, format = 'csv') => `${API_URL}/campaigns/${id}/export?format=${format}`,
    exportCsv: async (id) => {
      const token = getToken();
      const url = `${API_URL}/campaigns/${id}/export?format=csv`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `campaign-${id}-recipients.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  },
  numbers: {
    list: () => request('/numbers'),
    create: (body) => request('/numbers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/numbers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    provisionWhatsApp: (id) => request(`/numbers/${id}/provision-whatsapp`, { method: 'POST', body: JSON.stringify({}) }),
    unblock: (id) => request(`/numbers/${id}/unblock`, { method: 'POST', body: JSON.stringify({}) }),
  },
  analytics: {
    overview: () => request('/analytics/overview'),
    adminDashboard: () => request('/analytics/admin-dashboard'),
  },
  settings: {
    get: () => request('/settings'),
    getChatbot: () => request('/settings/chatbot'),
    updateChatbot: (body) => request('/settings/chatbot', { method: 'PUT', body: JSON.stringify(body) }),
  },
  demoRequests: {
    limits: () => request('/demo-requests/limits'),
    submit: (body) => request('/demo-requests', { method: 'POST', body: JSON.stringify(body) }),
    my: () => request('/demo-requests/my'),
    list: () => request('/demo-requests'),
    update: (id, status) => request(`/demo-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  ai: {
    generateMessage: (prompt) => request('/ai/generate-message', { method: 'POST', body: JSON.stringify({ prompt }) }),
  },
  apiKeys: {
    list: () => request('/api-keys'),
    create: (name) => request('/api-keys', { method: 'POST', body: JSON.stringify({ name }) }),
    revoke: (id) => request(`/api-keys/${id}`, { method: 'DELETE' }),
    listAll: () => request('/api-keys/all'),
    revokeAdmin: (id) => request(`/api-keys/admin/${id}`, { method: 'DELETE' }),
  },
  whatsapp: {
    status: () => request('/whatsapp/status'),
    accounts: () => request('/whatsapp/accounts'),
    addAccount: (label) => request('/whatsapp/accounts', { method: 'POST', body: JSON.stringify({ label }) }),
    reconnect: (clientId) => request(`/whatsapp/accounts/${clientId}/reconnect`, { method: 'POST', body: JSON.stringify({}) }),
    pairingCode: (clientId, phone) => request(`/whatsapp/accounts/${clientId}/pairing-code`, { method: 'POST', body: JSON.stringify({ phone }) }),
    removeAccount: (clientId) => request(`/whatsapp/accounts/${clientId}`, { method: 'DELETE' }),
    updateAccount: (clientId, body) => request(`/whatsapp/accounts/${clientId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    sendBulk: (numbers, message, delayMs, fileId) =>
      request('/whatsapp/send-bulk', { method: 'POST', body: JSON.stringify({ numbers, message, delayMs, fileId }) }),
    jobStatus: (jobId) => request(`/whatsapp/send-bulk/${jobId}`),
    cancelJob: (jobId) => request(`/whatsapp/send-bulk/${jobId}/cancel`, { method: 'POST', body: JSON.stringify({}) }),
    uploadMedia: async (file) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/whatsapp/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      return data;
    },
    deleteMedia: (fileId) => request(`/whatsapp/upload/${fileId}`, { method: 'DELETE' }),
    mySession: () => request('/whatsapp/my'),
    myConnect: () => request('/whatsapp/my/connect', { method: 'POST', body: JSON.stringify({}) }),
    myReconnect: () => request('/whatsapp/my/reconnect', { method: 'POST', body: JSON.stringify({}) }),
    myPairingCode: (phone) => request('/whatsapp/my/pairing-code', { method: 'POST', body: JSON.stringify({ phone }) }),
    myRemove: () => request('/whatsapp/my', { method: 'DELETE' }),
  },
};
