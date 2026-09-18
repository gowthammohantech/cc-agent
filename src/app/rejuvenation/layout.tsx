import type { ReactNode } from 'react';
import { NotMedicalAdvice } from '@/components/safety/NotMedicalAdvice';

/**
 * The disclaimer lives in the layout rather than the page, so no child route
 * under /rejuvenation can render research framing without it.
 */
export default function RejuvenationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <NotMedicalAdvice />
      {children}
    </div>
  );
}
