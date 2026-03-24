import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace(user ? (user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard') : '/login');
      return;
    }
    if (!user) return;
    api.settings.get()
      .then(setSettings)
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Platform Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Read-only view of key config (set via env)</p>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md shadow-sm">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cost per message</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-800">{settings?.costPerMessage ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chunk size (recipients per job)</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-800">{settings?.chunkSize ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cooldown (seconds per number)</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-800">{settings?.cooldownSeconds ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Max messages per number per day</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-800">{settings?.maxMessagesPerNumberPerDay ?? '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </AdminLayout>
  );
}
