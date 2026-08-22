'use client';

import { usePathname } from 'next/navigation';

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#9a9a9a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BallotIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#9a9a9a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h3" />
  </svg>
);

const ChartIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#9a9a9a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PersonIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffffff' : '#9a9a9a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/battle', label: 'BATTLE', Icon: HomeIcon },
    { href: '/candidature', label: 'CANDIDATURE', Icon: BallotIcon },
    { href: '/rankings', label: 'RANKINGS', Icon: ChartIcon },
    { href: '/profile', label: 'PROFILE', Icon: PersonIcon },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <a key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
            <Icon active={active} />
            <span className="nav-label">{label}</span>
          </a>
        );
      })}
    </nav>
  );
  }
