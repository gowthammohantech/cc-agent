import type { Metadata } from 'next';
import { getBundle } from '@/content/bundle';
import { AgeWorkspace } from '@/components/age/AgeWorkspace';

export const metadata: Metadata = {
  title: 'Explore Aging',
  description:
    'Move an age slider from birth to late life and see what is documented to change, with the evidence behind each change.',
};

export default function AgingPage() {
  const bundle = getBundle();
  const profiles = Object.fromEntries(bundle.evidenceProfiles.map((p) => [p.profile_id, p]));

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Explore aging</h1>
        <p className="mt-2 text-[var(--color-ink-muted)]">
          Aging is not one process. Move through age and see what each hallmark documents, how
          strongly it is evidenced, and where the curated record runs out.
        </p>
      </header>

      <AgeWorkspace bands={bundle.ageBands} profiles={profiles} />
    </div>
  );
}
