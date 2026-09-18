import Link from 'next/link';

const LINKS = [
  { href: '/aging', label: 'Aging' },
  { href: '/body', label: 'Body' },
  { href: '/hallmarks', label: 'Hallmarks' },
  { href: '/compare', label: 'Compare' },
  { href: '/network', label: 'Network' },
  { href: '/rejuvenation', label: 'Rejuvenation' },
  { href: '/simulate', label: 'Simulate' },
  { href: '/library', label: 'Library' },
] as const;

export function SiteNav() {
  return (
    <nav
      aria-label="Main"
      className="border-b border-[var(--color-line)] bg-[var(--color-surface-raised)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          AgeLens
        </Link>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:underline"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
