import { CONTENT_VERSION, CONTENT_GENERATED_AT } from '@/content/version';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-ink-muted)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>
          AgeLens &mdash; a visual computational map of human aging and rejuvenation science. Not an
          anti-aging treatment product.
        </p>
        <p>
          Content version <code className="font-mono">{CONTENT_VERSION}</code>, generated{' '}
          <time dateTime={CONTENT_GENERATED_AT}>{CONTENT_GENERATED_AT}</time>
        </p>
      </div>
    </footer>
  );
}
