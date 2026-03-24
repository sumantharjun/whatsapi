import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  { href: '/reseller/dashboard', label: 'Dashboard', section: null },
  { href: '/reseller/clients', label: 'Clients', section: 'clients' },
  { href: '/reseller/credits', label: 'Assign Credits', section: 'assign_credits' },
  { href: '/reseller/campaigns', label: "My User's Campaigns", section: 'campaigns' },
  { href: '/reseller/analytics', label: 'Analytics', section: 'analytics' },
  { href: '/reseller/api', label: 'API', section: 'api' },
  { href: '/reseller/demo-requests', label: 'Demo Requests', section: 'demo_requests' },
  { href: '/reseller/profile', label: 'Profile', section: null },
];

export default function ResellerLayout({ children }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const path = (router.asPath || router.pathname || '').split('?')[0];

  const enabledSections = user?.enabledSections;
  const visibleNav = nav.filter(({ section }) =>
    section === null || !Array.isArray(enabledSections) || enabledSections.includes(section)
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          WhatsApp Bulk
          <span className="app-badge">RESELLER</span>
        </div>
        <div className="app-actions">
          <Link href="/reseller/dashboard" className="app-link">Dashboard</Link>
          <Link href="/reseller/profile" className="app-link">Profile</Link>
          <span style={{ color: '#cbd5e1', fontSize: 13 }}>{user?.email}</span>
          <button type="button" onClick={() => { logout(); router.push('/login'); }} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <nav className="app-nav">
            <div className="app-nav-title">Reseller Panel</div>
            {visibleNav.map(({ href, label }) => (
              <Link key={`${href}-${label}`} href={href} className={`app-nav-link${path === href ? ' active' : ''}`}>
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
