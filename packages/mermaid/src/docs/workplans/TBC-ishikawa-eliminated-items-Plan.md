# TBC-ishikawa-eliminated-items: Mark eliminated Ishikawa items, Plan

## Spec

- [Delivery specification](./TBC-ishikawa-eliminated-items-Spec.md)
- Jira: none supplied.

## Overview

- Carry explicit elimination state from item ingestion through every label-rendering path, rather
  than encoding strike-through or a symbol into stored label text.
- Recognize the prefix in the Ishikawa DB's shared item-ingestion path; the existing Jison grammar
  already separates indentation from the item's text and need not change for this extension.
- Render a themed, measured label unit with visible strike-through and a separate undecorated `×`.
  Prefer SVG text decoration (`line-through`) on the label text, requiring no special font. If browser
  verification shows that decoration fails the spec's visual requirements, use measured SVG lines
  across each text line instead. Deliver one verified technique, not a user-selectable setting.
- Preserve existing output for unmarked items and avoid unrelated layout/parser refactoring.
- Use the spec's proposed contract: whitespace after `-`, `×`, root eligibility, and no cascading.
  Product questions remain recorded in the spec; this plan does not add symbol configuration or
  an escape convention.

## Tasks

- [x] Task 1: Preserve per-item elimination state without changing the hierarchy.
  - Touchpoints: `packages/mermaid/src/diagrams/ishikawa/ishikawaTypes.ts`,
    `ishikawaDb.ts`, and `ishikawa.spec.ts` in the same directory.
  - Add an optional boolean elimination field so existing plain node literals remain compatible;
    absent/false means ordinary presentation. Recognize one leading ASCII hyphen followed by
    spaces/tabs and a nonempty label before sanitizing the remaining label.
  - Apply recognition identically to the root and causes; retain the existing raw indentation,
    stack handling, sanitization, and cleaned root title. Never derive children's state from parents.
  - Include tests for both headers, prefix whitespace, literal hyphens, mixed/deep hierarchy,
    root indentation, duplicate labels, eliminated parents with active children, and DB reset.
  - Done when: the targeted Ishikawa unit suite passes and establishes the data/structure portions
    of spec AC 1–5, 8, and 9; existing unmarked node expectations still pass.

- [ ] Task 2: Render measured elimination labels across every Ishikawa label path.
  - Touchpoints: `packages/mermaid/src/diagrams/ishikawa/ishikawaRenderer.ts`,
    `ishikawaStyles.ts`, and a new focused Playwright spec under
    `e2e/rendering/ishikawa/pr-check/`.
  - Pass state through root/head drawing, boxed causes, `LabelEntry`/`flattenTree`, and both nested
    branch variants. Keep the symbol out of stored text and out of the word-wrapping input.
  - Extend shared label drawing to visibly strike through each label line and draw one adjacent
    symbol outside the decorated text element. Apply `line-through` only to marked label text and
    confirm it crosses every wrapped line in the final SVG, rather than relying on a class alone.
  - If text decoration cannot meet those checks, render one themed SVG line per nonempty text line.
    Measure each line after placement, cross its middle over its text width, and keep those lines in
    the label's coordinate system so head translations and branch positioning move them together.
    Do not draw strike lines through the symbol or through unmarked text.
  - Use themed text styling and measured bounds for the complete label unit, including any explicit
    line strokes and font/anchor/baseline differences; root/cause shapes must enclose the unit.
  - Reserve symbol space for end-anchored nested labels so the symbol does not cross a branch.
    Preserve the existing measurement/positioning path for unmarked labels; adjust only marked-label
    geometry as needed. Do not apply text decoration to a group containing the symbol.
  - Add browser assertions for all label paths, multiline strike-through, symbol counts, bounding-box
    containment/separation, unmarked siblings, and a later unmarked render. For text decoration,
    verify effective `line-through` on each text line; for explicit SVG lines, compare each stroke's
    position and span with the corresponding text bounds. Both approaches require visual proof that
    text is actually crossed out and the adjacent symbol is not.
  - Use existing rendering helpers and verify the final sanitized SVG, not only the
    pre-serialization DOM. Verify strike-through remains visible with changed font sizes.
  - Add visual fixtures under `e2e/diagrams/ishikawa/pr-check/` for mixed/deep states, wrapping and
    supported `<br>` breaks, default/dark/forest themes, and hand-drawn look.
  - Done when: focused browser assertions and Ishikawa fixture regressions pass for spec AC 1–9;
    inspect new snapshots and ensure ordinary fixtures have no unexplained visual changes.

- [ ] Task 3: Document and release-note the authoring extension.
  - Touchpoints: `packages/mermaid/src/docs/syntax/ishikawa.md`, a feature changeset in
    `.changeset/`, and generated documentation produced by the existing docs tooling.
  - Describe recognition boundaries, the chosen symbol, root eligibility, no inherited status,
    literal examples, the compatibility change for labels beginning with `- `, and a mixed-state
    diagram. Explain that labels receive both visible strike-through and a symbol, with no special
    font or HTML required, and removal of the prefix restores ordinary presentation.
  - Run `pnpm exec changeset` for the `mermaid` feature and regenerate documentation from source;
    do not manually edit generated docs or introduce new configuration/schema fields.
  - Done when: spec AC 10 is covered, spelling and generated-doc verification pass, and generated
    changes and changeset scope are reviewed. Re-run affected tests if example edits change fixtures.

## Dependencies & prerequisites

- Execute tasks in order: rendering consumes the state from Task 1; documentation demonstrates the
  completed behavior from Task 2. Each task owns its tests/checks rather than deferring verification.
- Use the Node version in `.node-version` and pinned pnpm; install workspace dependencies and build
  package exports before browser tests. Install Chromium with `pnpm playwright:install`.
- The current checkout has no workspace `node_modules` and its default Node is 20.17.0, below the
  repository's required version. Correct the runtime and install dependencies before execution;
  this plan has not run implementation tests.

## Verification

See the spec's Acceptance Criteria and Verification Plan. Focused commands from the repository root:

```sh
pnpm exec vitest run packages/mermaid/src/diagrams/ishikawa/ishikawa.spec.ts
pnpm playwright e2e/rendering/ishikawa/pr-check
pnpm playwright e2e/rendering/mmd-snapshots.spec.ts --grep ishikawa
pnpm lint
pnpm test:check:tsc
pnpm --filter mermaid checkCircle
pnpm --filter mermaid docs:build
pnpm --filter mermaid docs:verify
```

The global `mmd-snapshots.spec.ts` runner discovers `.mmd` fixtures and nests their folder names in
Playwright titles. Filtering the fixture directory as if it were a spec will not run those fixtures;
use `--grep ishikawa`. The direct Ishikawa spec command applies after Task 2 adds that spec.
Update snapshots only for intentional additions/geometry changes, then rerun without update mode.
Broaden to `pnpm ci` after the focused runtime checks pass.

## Risks & mitigations

- Decoration can change SVG text metrics and anchors: measure the full text/symbol unit and verify
  actual browser bounds for every label path, including standard/hand-drawn boxes and effect heads.
- Nested tree flattening currently copies text but has no status field: explicitly carry the state
  into `LabelEntry` so deeply nested eliminated items are not silently rendered as active.
- Text decoration inheritance can strike through the symbol: keep symbol/text as separately styled
  elements and assert the resulting SVG presentation after sanitization. Prefer text decoration only
  if screenshot checks show a visible mid-text strike across every line.
- Explicit strike lines can drift after translation or scaling: measure in the label's local
  coordinate system, include stroke extents in layout bounds, and test root/head transforms,
  nested anchors, multiline labels, and changed font sizes if this technique is needed.
- Docs generation includes all source Markdown, including this workplans directory. Docs checks can
  therefore generate copies of the committed spec and this plan in root `docs/`; inspect those
  outputs and spelling failures rather than assuming planning documents are excluded.
- Local declaration builds may log errors without failing: use the consumer TypeScript check and
  inspect build output rather than treating a successful bundle build as type verification.
- Product choices remain the four questions in the spec: prefix-without-whitespace support, symbol
  preference, root eligibility, and a literal `- ` escape. Use the documented draft defaults unless
  the specification is revised; do not resolve them by adding unrelated features during execution.

## Out of scope

No cascading elimination, interactive controls, pruning, configurable icons, generalized text
formatting, new escape syntax, or changes to other diagrams.

## Rollback

Follow the spec's Rollback Plan; keep syntax, model, renderer, documentation, and release-note changes
coherent if the feature is withdrawn.
