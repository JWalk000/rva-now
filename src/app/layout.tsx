import type { Metadata } from 'next';

import { SiteNav } from '@/components/SiteNav';
import { AppProvider } from '@/context/AppProvider';

import './globals.css';

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
    <html lang="en">
      <body className="min-h-screen bg-[#F3F0EB] text-[#14121A] antialiased">
        <AppProvider>
          <main className="mx-auto min-h-screen max-w-3xl">{children}</main>
          <SiteNav />
        </AppProvider>
      </body>
    </html>
  );
}
