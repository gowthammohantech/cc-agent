# Content changelog

## 0.1.0 — 2026-09-18

Initial seed corpus. All records ship as `review_status: in_review` and have not
been reviewed by a domain expert.

- 55 biological entities spanning organism → system → organ → tissue → cell type
  → organelle / pathway → biomarker.
- 12 hallmarks of aging (2023 framework), each with an eight-dimension evidence
  profile whose overall label is authored rather than computed.
- 25 observations. Three are deliberately classified as `development` or
  `unclear` rather than `age_associated_change`, because conflating development
  with aging is one of the failure modes this product exists to avoid.
- 36 graph relationships. Correlational edges are marked `correlational_only`
  and do not propagate in the simulation engine.
- 6 rejuvenation targets, each carrying at least one risk and one unknown.
- 13 research approach categories.
- 33 sources.
- Body layout with 10 shell parts and 29 organ parts across 12 systems.

### Known gaps

- **No trajectories.** A trajectory requires numeric points, each individually
  cited. The build environment has no scholarly network access, so no numeric
  series could be verified against its source. Rather than fill charts with
  plausible-looking curves, the corpus ships empty here and the UI renders its
  "no curated data" state. This is the highest-value contribution available.
- **Single population.** Everything uses `general_adult`. For bone density and
  several other measures the sex difference is large and well documented, so the
  mixed-sex framing is inadequate; the affected records say so in their
  `known_conflicts`.
- **References are `unverified_offline`.** Identifiers were transcribed from
  well-known references but not resolved against a registry. Treat them as leads
  to check, not guarantees.
