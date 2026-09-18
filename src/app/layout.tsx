import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { GlobalDisclaimerBar } from '@/components/safety/GlobalDisclaimerBar';
import { PendingReviewBanner } from '@/components/safety/PendingReviewBanner';
import { SkipLink } from '@/components/ui/SkipLink';
import { SiteNav } from '@/components/ui/SiteNav';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { EvidenceDrawerHost } from '@/components/evidence/EvidenceDrawerHost';
import { getBundle } from '@/content/bundle';

export const metadata: Metadata = {
  title: {
    default: 'AgeLens — Human Aging & Rejuvenation Explorer',
    template: '%s · AgeLens',
  },
  description:
    'A visual computational map of human aging and rejuvenation science. Educational resource; not medical advice.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // The source records are small and every page can open a drawer, so they are
  // passed once from the layout rather than refetched per page.
  const studies = Object.fromEntries(getBundle().studies.map((s) => [s.source_id, s]));

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
        <EvidenceDrawerHost studies={studies} />
      </body>
    </html>
  );
}
