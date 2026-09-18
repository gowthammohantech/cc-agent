# AgeLens

An interactive visual map of human aging and rejuvenation science.

The central interface is a **birth → late life age slider** synchronized to a
human body model. Move through age and the application shows what is documented
to change — across organ systems, tissues, cells, organelles and molecular
pathways — always with the evidence, population context and uncertainty attached.

A second mode, **Rejuvenation Explorer**, asks a different question: if a
biological feature changes with age, what would theoretically need to improve,
repair, reset, replace, remove or regenerate to move it toward a younger
functional state — and how strongly has that been demonstrated, in what system,
and in which species?

## What AgeLens is not

- Not medical advice, diagnosis, or treatment.
- Not a personal biological-age estimator. It never scores an individual.
- Not a claim that whole-body human aging can currently be safely reversed.

Human, clinical, observational, animal, in-vitro, hypothetical and speculative
evidence are labeled separately and never merged into a single score.

> **Content status:** the seed scientific corpus ships as `in_review` and has not
> yet been signed off by a domain expert. Every record carries its own sources,
> evidence level and stated uncertainty.

## Getting started

Requires Node 22+.

```bash
npm install
npm run dev          # http://localhost:3000
```

## Commands

| Command                 | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Development server                                               |
| `npm run build`         | Production build (runs the content and claim gates first)        |
| `npm run ci`            | typecheck → lint → verify:content → verify:claims → test → build |
| `npm test`              | Unit, content-integrity and component tests                      |
| `npm run test:content`  | The content-integrity suite alone                                |
| `npm run verify:claims` | Scan content and source for prohibited claim phrasing            |
| `npm run content:hash`  | Regenerate `content/manifest.json`                               |
| `npm run test:e2e`      | Playwright end-to-end tests (needs a build)                      |
| `npm run bench`         | Performance benchmarks for the age-slider budget                 |

## How it is built

Next.js (App Router) + TypeScript + Tailwind. Scientific content lives as
versioned JSON in `content/`, validated by zod schemas in `schemas/` at build
time, test time and load time — git is the audit trail. There is no database.

The body view is built from procedural geometry rather than licensed anatomical
models, so it is a labeled schematic, not an anatomy reference. It degrades from
three.js to a 2D SVG diagram to a plain DOM tree, and the tree is always present
in the accessibility tree.

See [`CLAUDE.md`](./CLAUDE.md) for the conventions and the safety rules that are
enforced mechanically rather than by review.
