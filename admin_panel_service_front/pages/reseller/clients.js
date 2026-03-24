import { useEffect, useState } from 'react';
import ResellerLayout from '../../components/ResellerLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useRouter } from 'next/router';

export default function ResellerClients() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const toast = useToast();
  const onRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      await api.auth.register({ email: regEmail, password: regPassword, role: 'client' });
      setRegEmail('');
      setRegPassword('');
      setShowRegister(false);
      const r = await api.users.list({ role: 'client' });
      setUsers(r.users || []);
      toast.success('Client registered');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'reseller')) {
      router.replace(user ? (user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.users.list({ role: 'client' })
      .then((r) => setUsers(r.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <ResellerLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">Register and manage your clients</p>
        </div>
        <button type="button" onClick={() => setShowRegister(!showRegister)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-900/20">Register client</button>
      </div>
      {showRegister && (
        <form onSubmit={onRegister} className="bg-white border border-slate-200 rounded-xl p-6 mb-6 max-w-md space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" placeholder="client@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password (min 8 chars)</label>
            <input type="password" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required minLength={8} />
          </div>
          <button type="submit" disabled={regLoading} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Register</button>
        </form>
      )}
      {loading ? <LoadingSpinner /> : users.length === 0 ? <EmptyState message="No clients yet." /> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Credits</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{u.email}</td>
                  <td className="px-5 py-3.5 text-slate-600">{u.creditBalance ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ResellerLayout>
  );
}
