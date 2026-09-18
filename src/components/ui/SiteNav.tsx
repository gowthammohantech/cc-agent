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
              {/*
                py-1 brings these to the 24px minimum target size of WCAG 2.5.8.
                The "inline within a sentence" exemption does not cover a
                navigation list, and a manual keyboard pass measured them at
                16px — automated scanning did not flag it.
              */}
              <Link
                href={l.href}
                className="inline-block py-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:underline"
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
