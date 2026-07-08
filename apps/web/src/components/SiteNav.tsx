'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Discover', icon: '✦' },
  { href: '/map', label: 'Map', icon: '◎' },
  { href: '/feed', label: 'Feed', icon: '◉' },
  { href: '/you', label: 'You', icon: '○' },
];

export function SiteNav() {
  const pathname = usePathname();
  const hideNav = pathname.startsWith('/privacy') || pathname.startsWith('/terms');

  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E6E0D8] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-[72px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                active ? 'text-[#C44B2F]' : 'text-[#8A8490]'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
