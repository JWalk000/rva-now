'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Discover' },
  { href: '/map', label: 'Map' },
  { href: '/feed', label: 'Feed' },
  { href: '/you', label: 'You' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hideNav = pathname.startsWith('/privacy') || pathname.startsWith('/terms');

  if (hideNav) return null;

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#DED8D0] bg-[#F3F0EB]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-[0.18em] text-[#14121A]">
            CITIPILOT
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    active ? 'bg-[#C44B2F] text-white' : 'text-[#14121A]/70 hover:text-[#14121A]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/submit"
            className="rounded-full border border-[#14121A]/20 bg-white px-4 py-2 text-sm font-bold text-[#14121A] transition hover:border-[#14121A]/35 hover:bg-[#EBE6DF]"
          >
            List an Event
          </Link>
          <Link
            href="/you"
            className="rounded-full bg-[#C44B2F] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#9E3A24]"
          >
            Account
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-[#14121A]/20 bg-white px-3 py-2 text-sm font-bold text-[#14121A] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#DED8D0] bg-[#F3F0EB] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-3 text-sm font-bold ${
                    active ? 'bg-[#C44B2F] text-white' : 'text-[#14121A]/75'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/submit"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-bold text-[#14121A]/75"
            >
              List an Event
            </Link>
            <Link
              href="/you"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-[#C44B2F] px-4 py-3 text-center text-sm font-extrabold text-white"
            >
              Account
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
