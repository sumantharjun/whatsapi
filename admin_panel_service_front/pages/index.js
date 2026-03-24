import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const dash = user.role === 'admin' ? '/admin/dashboard' : user.role === 'reseller' ? '/reseller/dashboard' : '/client/dashboard';
    router.replace(dash);
  }, [user, loading, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <LoadingSpinner />
    </div>
  );
}
