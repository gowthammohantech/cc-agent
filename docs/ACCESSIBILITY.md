# Accessibility

Automated scanning catches roughly a third of real accessibility problems, so
the axe sweep in `tests/e2e/a11y.spec.ts` is a floor, not a pass mark. This
records what was checked by hand and what it found.

## Automated coverage

- **axe-core** across all 17 routes, WCAG 2.0/2.1 A and AA tags, failing on any
  serious or critical violation.
- **eslint-plugin-jsx-a11y** at `strict`, not `recommended`.
- **Greyscale readability** (`tests/e2e/greyscale.spec.ts`): the page is forced
  to `grayscale(100%)` and every piece of scientific state is asserted to still
  be carried by words, patterns or numbered callouts.
- **Target size** (`tests/e2e/a11y.spec.ts`): every non-exempt interactive
  target is asserted to be at least 24px tall.
- **Keyboard reachability**: every primary destination is asserted reachable by
  Tab from the home page, and the skip link is asserted to be the first stop.

## Manual keyboard pass

Performed by driving Tab through `/aging`, `/body`, `/compare` and `/simulate`
and measuring every focus stop.

**Findings, all fixed:**

| Finding                                        | Detail                                                                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation links were 16px tall                | Below WCAG 2.5.8's 24px minimum. The "inline within a sentence" exemption does not cover a navigation list. Fixed with vertical padding. |
| Hallmark and target card title links were 19px | Block links inside cards, not inline text. Fixed.                                                                                        |
| "Why is this happening?" link was 14px         | A standalone action link in its own paragraph. Fixed.                                                                                    |
| Renderer and view-toggle labels were 20px      | The wrapping `<label>` is the real target, and it was still under the minimum. Fixed.                                                    |

**axe did not report any of these.** They are the reason the manual pass exists.

**Verified good:**

- Every focus stop has a visible outline (checked computed `outline-width`).
- Focus order follows reading order on all four routes.
- No keyboard trap: the evidence drawer is a `<dialog showModal>`, so the rest
  of the document is inert, and focus never reaches page content behind it.
- The body view is fully operable with no mouse: the tree implements the
  WAI-ARIA tree pattern with roving tabindex, arrow-key traversal, left/right
  collapse and expand, Home and End.

**Known exemptions, honoured rather than papered over:**

- Links inline within a sentence (for example "How content is reviewed" in the
  review banner) are explicitly exempt under WCAG 2.5.8.
- The skip link is 1×1 until focused, at which point it is full size.

## Manual screen-reader pass

Performed against the ARIA tree Chromium exposes (`ariaSnapshot`), checking
what assistive technology would actually traverse.

**Verified:**

- Both standing notices are `complementary` landmarks with accessible names
  ("Important notice about this resource", "Content review status"), so they are
  reachable by landmark navigation rather than only by reading top to bottom.
- The age slider announces `Age 70, later adulthood` rather than a bare number.
- The body canvas sits inside an `aria-hidden` subtree; the body structure tree
  carries the same entities and is always present.
- Selection changes are announced through a polite live region.
- The compare view is a real table with a caption and row headers.
- Charts and diagrams expose a descriptive accessible name, and the equivalent
  content is available as text through a visible toggle rather than being
  reserved for assistive technology.

## Not yet done

- No testing with real screen-reader software (NVDA, JAWS, VoiceOver). The ARIA
  tree tells you what is exposed, not how it sounds.
- No testing with real users of assistive technology.
- Colour contrast is asserted by axe but has not been checked by hand at 200%
  zoom in both themes.
