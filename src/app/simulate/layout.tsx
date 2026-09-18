import type { ReactNode } from 'react';
import { getBundle } from '@/content/bundle';
import { SimulationBanner } from '@/components/simulate/SimulationBanner';
import { NotMedicalAdvice } from '@/components/safety/NotMedicalAdvice';

export default function SimulateLayout({ children }: { children: ReactNode }) {
  const bundle = getBundle();
  return (
    <div className="space-y-5">
      <SimulationBanner disclaimer={bundle.disclaimers.simulation} />
      <NotMedicalAdvice />
      {children}
    </div>
  );
}
