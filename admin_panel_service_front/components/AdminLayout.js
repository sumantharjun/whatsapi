import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
  Menu,
  LayoutDashboard,
  Megaphone,
  Code,
  MessageCircle,
  FileText,
  BarChart3,
  CreditCard,
  Users,
  ClipboardList,
  User,
  LogOut,
  Smartphone,
  Key,
  Shield,
} from 'lucide-react';
const BrandIcon = MessageCircle;

const navSections = [
  { label: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
  { label: 'API', href: '/admin/api', icon: Code },
  { label: 'Chatbot', href: '/admin/chatbot', icon: MessageCircle },
  {
    label: 'Reports',
    icon: FileText,
    children: [
      { label: 'WhatsApp Report', href: '/admin/reports/whatsapp', icon: MessageCircle },
      { label: 'User Campaigns', href: '/admin/reports/campaigns', icon: BarChart3 },
      { label: 'Credit History', href: '/admin/reports/credits', icon: CreditCard },
    ],
  },
  {
    label: 'Management',
    icon: Users,
    children: [
      { label: 'WhatsApp Login', href: '/admin/whatsapp-login', icon: MessageCircle },
      { label: 'Virtual Numbers', href: '/admin/numbers', icon: Smartphone },
      { label: 'Manage Users', href: '/admin/users', icon: Users },
      { label: 'Access Control', href: '/admin/access', icon: Shield },
      { label: 'Credit Manage', href: '/admin/credits', icon: CreditCard },
      { label: 'Demo Requests', href: '/admin/demo-requests', icon: ClipboardList },
      { label: 'API Keys', href: '/admin/api', icon: Key },
    ],
  },
  {
    label: 'Account',
    userSection: true,
    icon: User,
    children: [
      { label: 'Profile', href: '/admin/profile', icon: User },
      { label: 'Logout', href: '/admin/logout', isLogout: true, icon: LogOut },
    ],
  },
];

function isActive(path, href) {
  if (href === '/admin/dashboard') return path === '/admin/dashboard';
  return path === href || path.startsWith(href + '/');
}

const iconSize = 18;

function NavLink({ href, label, path, isLogout, logout, router, isHome, icon: Icon }) {
  const active = isActive(path, href);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const iconEl = Icon ? <Icon size={iconSize} strokeWidth={2} aria-hidden /> : null;

  if (isLogout) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="admin-nav-btn"
      >
        {iconEl}
        {label}
      </button>
    );
  }
  if (isHome) {
    return (
      <Link
        href={href}
        className={`admin-nav-home ${active ? 'active' : ''}`}
      >
        <span className="admin-nav-home-icon" aria-hidden><LayoutDashboard size={iconSize} strokeWidth={2} /></span>
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`admin-nav-item ${active ? 'active' : ''}`}
    >
      {iconEl}
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const path = (router.asPath || router.pathname || '').split('?')[0];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="admin-root">
      <header className="admin-header">
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="admin-hamburger"
          aria-label="Toggle menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
        <Link href="/admin/dashboard" className="admin-header-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandIcon size={22} strokeWidth={2} />
          WhatsApp
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{user?.email}</span>
        </div>
      </header>

      <div className="admin-banner">
        <marquee direction="left" behavior="scroll">
          Session Time Will Be From 9:30 AM to 6:00 PM. On Sunday It Will Be From 9:30 AM to 12 PM
        </marquee>
      </div>

      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        onKeyDown={(e) => e.key === 'Escape' && closeSidebar()}
        role="button"
        tabIndex={0}
        aria-label="Close menu"
      />

      <div className={`admin-body`}>
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="admin-nav" aria-label="Admin menu">
            <NavLink href="/admin/dashboard" label="Dashboard" path={path} router={router} logout={logout} isHome />
            {navSections.map((section) =>
              section.children ? (
                <div
                  key={section.label}
                  className={`admin-nav-section ${section.userSection ? 'admin-nav-section-user' : ''}`}
                >
                  <span className="admin-nav-section-title">
                    {section.icon && (() => { const Icon = section.icon; return <Icon size={14} strokeWidth={2} style={{ marginRight: 6, verticalAlign: 'middle', opacity: 0.9 }} /> })()}
                    {section.label}
                  </span>
                  <div className="admin-nav-section-links">
                    {section.children.map((item) => (
                      <NavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        path={path}
                        isLogout={item.isLogout}
                        router={router}
                        logout={logout}
                        icon={item.icon}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div key={section.label} className="admin-nav-section admin-nav-section-single">
                  <div className="admin-nav-section-links">
                    <NavLink
                      href={section.href}
                      label={section.label}
                      path={path}
                      router={router}
                      logout={logout}
                      icon={section.icon}
                    />
                  </div>
                </div>
              )
            )}
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
