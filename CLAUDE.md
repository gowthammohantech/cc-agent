# AgeLens — repository conventions

AgeLens is a visual computational map of human aging and rejuvenation science.
It is an **educational and research-visualization** product, not a treatment
product, not a diagnostic, and not a biological-age estimator.

## The rules that are not negotiable

These come from the product spec (BRD/PRD/FRD §6, §20, §31, §37, §44, §49) and
are enforced mechanically. Do not weaken an enforcement point to make a feature
easier or a demo prettier.

1. **No claim without a source.** `Provenance.citations` is `.min(1)` in zod. An
   uncited scientific claim cannot parse, so it cannot ship.
2. **No invented numbers.** A number may only exist inside an `effect` of
   `kind: 'quantitative'`, which requires `source_reported: true` and its own
   citation. `tests/content/percentages.test.ts` also scans prose for bare
   percentages and fold-changes. If you cannot verify a figure, do not write it.
3. **No single evidence score.** `EvidenceProfile` has eight independent
   dimensions and an authored categorical label. Never add a numeric score, and
   never compute the label by averaging the dimensions.
4. **Correlation never becomes causation.** `ASSOCIATED_WITH` edges do not
   propagate in the simulation engine. Blocked edges are reported to the user,
   not silently dropped — the boundary of knowledge is a product feature.
5. **No personal age output.** The simulation output type has no numeric
   magnitude, score, or age field. `serializeSimulation()` throws if the
   disclaimer is missing or the whole-organism claim was altered.
6. **Missing data is visible.** `TrajectorySample` is a discriminated union with
   an explicit `no_data` case. An empty region must never render as a zero or a
   flat line.
7. **Never color alone.** Every state color token in `globals.css` has a
   `--pattern-*` partner. Scientific state is carried by text + pattern + shape,
   with color as reinforcement only.
8. **Development, aging and disease stay distinct.** `change_class` is required
   on observations and the UI never mixes classes in one chart series.

## Enforcement points

| Rule                              | Enforced by                                                              |
| --------------------------------- | ------------------------------------------------------------------------ |
| Citations, uncertainty            | zod schemas in `schemas/`                                                |
| No invented numbers               | `tests/content/percentages.test.ts`                                      |
| No prohibited phrasing            | `scripts/check-banned-claims.ts` + `tests/content/banned-claims.test.ts` |
| Claim components carry provenance | custom ESLint rule `local/require-evidence-prop`                         |
| Simulation safety                 | `serializeSimulation()` + golden tests                                   |
| Content freshness                 | `tests/content/{manifest,freshness}.test.ts`                             |

`npm run build` depends on `verify:content` and `verify:claims`, so a broken
scientific record fails the build rather than reaching a reader.

## Content is code

There is no database. `content/**.json` is the source of truth, validated by zod
at build time, test time and load time; git is the audit trail. This is an
honest substitute for the spec's FR-11 CMS, not a claim to have implemented it —
`/about/methodology` says so in the product itself.

The seed corpus ships as `review_status: 'in_review'`. It is fully visible
(hiding it would make the app useless) under a site-wide pending-review banner.
Only `draft` / `needs_revision` / `retired` are hidden in production.

Changing content requires regenerating the manifest (`npm run content:hash`), so
the version bump lands in the diff where a reviewer sees it.

## Architecture notes

- `schemas/` is framework-free so the CLI scripts can import it. TS types derive
  from zod via `z.infer` — one definition serves scripts, tests, API and UI.
- `src/domain/` is pure and has a 90% line-coverage floor. No React, no fetch.
- **Intentional duplication:** the slider-critical content subset is bundled
  client-side so slider movement performs zero network requests, while the
  FR-15 route handlers under `src/app/api/` serve deep links and are the seam
  for a future database. Both call the same engine functions, and a test runs
  identical fixtures through both to prove they agree.
- `src/three/renderer/BodyRenderer.ts` is an interface with three
  implementations (three.js / SVG / DOM list). The body figure is built from
  procedural primitives — there are no licensed anatomical assets — so every
  body view carries a persistent stylization notice.

## Toolchain pins (do not bump casually)

- `react`/`react-dom` **19.2.8** — `@react-three/fiber@9` requires `>=19 <19.3`.
- `typescript` **~5.9** — `typescript-eslint@8` requires `<6.1.0`.
- `eslint` **9.x** — `eslint-plugin-jsx-a11y@6.10` caps at `^9`, and
  `eslint-config-next` depends on it.

## Commands

```
npm run dev              # dev server
npm run ci               # typecheck → lint → verify:content → verify:claims → test → build
npm run test:content     # the content-integrity suite alone
npm run verify:claims    # FR-17 prohibited-claim scan
npm run content:hash     # regenerate content/manifest.json
npm run test:e2e         # Playwright (needs a production build)
```
