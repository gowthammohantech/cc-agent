import { CONTENT_VERSION, CONTENT_GENERATED_AT } from '@/content/version';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-ink-muted)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <nav aria-label="About this resource" className="flex flex-wrap gap-x-4 gap-y-1">
          {/* Navigation links, so the 24px target-size minimum applies. */}
          <a className="inline-block py-1 underline" href="/about/methodology">
            Methodology
          </a>
          <a className="inline-block py-1 underline" href="/about/evidence-model">
            Evidence model
          </a>
          <a className="inline-block py-1 underline" href="/about/limitations">
            Limitations
          </a>
        </nav>
        <p>
          Content version <code className="font-mono">{CONTENT_VERSION}</code>, generated{' '}
          <time dateTime={CONTENT_GENERATED_AT}>{CONTENT_GENERATED_AT}</time>
        </p>
      </div>
    </footer>
  );
}
