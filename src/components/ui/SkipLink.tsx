export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[var(--color-surface-raised)] focus:px-3 focus:py-2 focus:text-[var(--color-ink)] focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
