import type { Metadata } from 'next';
import { Outfit, Syne } from 'next/font/google';

import { SiteNav } from '@/components/SiteNav';
import { AppProvider } from '@/context/AppProvider';

import './globals.css';

const display = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

const body = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Citipilot — Discover Richmond Events & Places',
  description:
    'The fastest way to know what is happening in Richmond. Personalized local event discovery with maps, curated lists, and community places.',
  metadataBase: new URL('https://citipilot.app'),
  openGraph: {
    title: 'Citipilot',
    description: 'Discover events, places, and what RVA is doing right now.',
    siteName: 'Citipilot',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen text-[#14121A] antialiased">
        <AppProvider>
          <SiteNav />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
