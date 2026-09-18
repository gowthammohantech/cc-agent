import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { GlobalDisclaimerBar } from '@/components/safety/GlobalDisclaimerBar';
import { PendingReviewBanner } from '@/components/safety/PendingReviewBanner';
import { SkipLink } from '@/components/ui/SkipLink';
import { SiteNav } from '@/components/ui/SiteNav';
import { SiteFooter } from '@/components/ui/SiteFooter';

export const metadata: Metadata = {
  title: {
    default: 'AgeLens — Human Aging & Rejuvenation Explorer',
    template: '%s · AgeLens',
  },
  description:
    'A visual computational map of human aging and rejuvenation science. Educational resource; not medical advice.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <SkipLink />
        <GlobalDisclaimerBar />
        <PendingReviewBanner />
        <SiteNav />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
