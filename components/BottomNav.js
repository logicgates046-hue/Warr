'use client';

import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <a href="/battle" className={`nav-item ${pathname === '/battle' ? 'active' : ''}`}>
        <span className="nav-icon">⚔️</span>
        <span className="nav-label">BATTLE</span>
      </a>
      <a href="/profile" className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}>
        <span className="nav-icon">👤</span>
        <span className="nav-label">PROFILE</span>
      </a>
    </nav>
  );
}
