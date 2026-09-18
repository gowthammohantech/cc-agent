# Contributing scientific content

Content lives as versioned JSON in `content/`, validated by zod schemas in
`schemas/`. There is no database and no CMS: git is the audit trail.

## The rules, and why they are enforced rather than requested

Every one of these is a build failure, not a review comment, because each
describes a mistake that is easy to make and hard to spot afterwards.

**Every claim needs a source and a stated uncertainty.** `provenance.citations`
is `.min(1)` and `uncertainty.description` must say something. A record missing
either cannot parse, so it cannot load and cannot ship.

**A number may only exist where its source is named.** Figures live inside an
`effect` of `kind: "quantitative"`, which requires `source_reported: true` and
its own citation. A prose scanner separately rejects bare percentages and
fold-changes. If you cannot verify a figure, write the direction in words
instead — `kind: "qualitative"` exists for exactly this.

**Say what is not known.** `risks` and `unknowns` on a rejuvenation target are
both `.min(1)`. A target with neither reads as an endorsement.

**Record causal standing separately from evidence strength.** They are
different questions. A finding can rest on large consistent human data and
still be `correlational_only` — several of the best-known associations in this
field are exactly that. Correlational edges never propagate in the simulation.

**Do not claim a review that did not happen.** `review_status: "approved"`
requires a named `reviewed_by` and a `reviewed_at` date.

**Do not claim verification that did not happen.** Source identifiers default
to `reference_verification: "unverified_offline"`. Only set anything else if you
actually resolved the identifier against a registry, and record `verified_at`.

## Adding a record

1. Edit the relevant file under `content/`.
2. `npm run verify:content` — schema, references, coverage floors.
3. `npm run verify:claims` — prohibited claim phrasing.
4. `npm run test:content` — the full integrity suite.
5. `npm run content:hash` — regenerate the manifest. **Required**: a test fails
   if the manifest is stale, which puts the version bump in the diff where a
   reviewer is already looking.
6. Update `content/CHANGELOG.md`.

## The highest-value contribution right now

**Curated trajectories.** There are currently none, so every chart-shaped
question renders as a stated gap. A trajectory needs numeric points, each with
its own citation, and none could be verified against its source in the build
environment this corpus was authored in.

Second most valuable: **sex-stratified populations**. Everything currently uses
one composite `general_adult` population, which is inadequate for bone density
and several other measures where the sex difference is large and well
documented. The affected records say so in their `known_conflicts`.

## What not to do

Do not fill a gap with a plausible-sounding record. Thin coverage is visible by
design — the interface names the systems it has no data for, precisely so that
nobody is tempted to make the grid look full. A fabricated record is worse than
an empty cell, because a gap invites checking and a fabrication does not.
