import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

// section: null = always visible; string key = controlled by admin
const nav = [
  { href: '/client/dashboard', label: 'Dashboard', section: null },
  { href: '/client/campaigns', label: 'Campaign', section: 'campaign', activeWhen: (path) => path.startsWith('/client/campaigns') && !path.includes('type=button') },
  { href: '/client/campaigns?type=button', label: 'Button Campaign', section: 'campaign', activeWhen: (path) => path.includes('type=button') },
  { href: '/client/dp-campaign', label: 'DP Campaign', section: 'campaign' },
  { href: '/client/action-button', label: 'Action Button', section: 'action_button' },
  { href: '/client/button-sms', label: 'Button SMS', section: 'button_sms' },
  { href: '/client/api', label: 'API', section: 'api' },
  { href: '/client/chatbot', label: 'Chatbot', section: 'chatbot' },
  { href: '/client/whatsapp-report', label: 'WhatsApp Report', section: 'whatsapp_report' },
  { href: '/client/campaigns', label: "My User's Campaigns", section: 'my_campaigns' },
  { href: '/client/credits', label: 'Credit History', section: 'credits' },
  { href: '/client/credits', label: 'Credit Manage', section: 'credits' },
  { href: '/client/whatsapp-login', label: 'My WhatsApp', section: null },
  { href: '/client/demo-requests', label: 'Demo Requests', section: 'demo_requests' },
  { href: '/client/profile', label: 'Profile', section: null },
];

export default function ClientLayout({ children }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const asPath = router.asPath || '';

  // null enabledSections = all visible; array = only listed sections + always-on items
  const enabledSections = user?.enabledSections;
  const visibleNav = nav.filter(({ section }) =>
    section === null || !Array.isArray(enabledSections) || enabledSections.includes(section)
  );

  const isActive = (href, activeWhen) => {
    if (activeWhen) return activeWhen(asPath);
    return asPath.split('?')[0] === href;
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          WhatsApp Bulk
          <span className="app-badge">CLIENT</span>
        </div>
        <div className="app-actions">
          <Link href="/client/dashboard" className="app-link">Dashboard</Link>
          <Link href="/client/profile" className="app-link">Profile</Link>
          <span style={{ color: '#cbd5e1', fontSize: 13 }}>{user?.email}</span>
          <button type="button" onClick={() => { logout(); router.push('/login'); }} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
        </div>
      </header>
      <div className="app-topbar">
        Session Time Will Be From 9:30 AM to 6:00 PM. On Sunday It Will Be From 9:30 AM to 12 PM
      </div>
      <div className="app-body">
        <aside className="app-sidebar">
          <nav className="app-nav">
            <div className="app-nav-title">Client Panel</div>
            {visibleNav.map(({ href, label, activeWhen }, i) => (
              <Link
                key={`${href}-${label}-${i}`}
                href={href}
                className={`app-nav-link${isActive(href, activeWhen) ? ' active' : ''}`}
              >
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
