# TBC-ishikawa-eliminated-items: Mark eliminated Ishikawa items

## Goal

Authors can retain ruled-out items in an Ishikawa diagram while clearly distinguishing them from
remaining candidates: prefix an item with `-`, and render its label crossed out with an adjacent
elimination symbol.

## Context

- Ishikawa currently accepts `ishikawa` and `ishikawa-beta`, with an effect as the first item and
  causes/subcauses arranged by indentation.
- Labels currently have no elimination state. A leading hyphen is ordinary label text.
- Labels appear in the effect head, boxed causes, and nested branch labels. Nested labels can wrap
  across multiple lines, so the new presentation must cover more than one label shape.
- This is a draft specification without a supplied issue key. The syntax boundary and symbol below
  are proposed assumptions, not previously established product decisions.

## Scope

### In scope

- An authoring prefix for an individual eliminated item, available with both diagram headers.
- Strike-through and an adjacent symbol on the rendered label, without removing the item or its
  connecting branch.
- Effect, cause, and nested-subcause labels, including wrapped and explicitly broken lines.
- Mixed eliminated/unmarked items, existing indentation rules, themes, and hand-drawn rendering.
- Syntax documentation describing elimination, examples, and the leading-hyphen compatibility change.
- Parser/model regression coverage and browser-rendering verification.

### Out of scope

- Automatically determining whether a cause has been eliminated.
- Automatically eliminating descendants, ancestors, or siblings.
- Hiding eliminated items, changing branch connectivity, or pruning the diagram.
- Interactive toggles, additional status types, or changes to other diagram formats.
- A configurable symbol or multiple selectable symbols in this initial extension.

## Constraints & Assumptions

The following define the proposed delivery contract pending review:

- Recognize an ASCII hyphen followed by one or more spaces/tabs and a nonempty label, after the
  item's existing indentation: `- Cause`. Remove the prefix and its separating whitespace from
  the displayed label. Leading indentation alone continues to determine parentage.
- Preserve `-Cause`, `-5`, `--Cause`, internal hyphens, and non-ASCII dash characters as literal text.
  A line containing only `-` remains a literal label rather than creating an empty eliminated item.
- Reserve `- ` at the start of an item for elimination. Existing labels beginning with that exact
  sequence intentionally acquire the new semantics; documentation must disclose this change.
- Use `×` (U+00D7) as the initial symbol because the user accepts either `×` or `✔`. Place it after
  the label, separated from the text, and do not strike through the symbol itself.
- Elimination applies only to the explicitly prefixed item, including the effect/root if marked.
  An eliminated parent retains its children, which remain unmarked unless individually prefixed.
- Use text strike-through and a symbol, not color alone. Preserve existing text sanitization and
  security behavior; authors do not need HTML to express the state.
- Existing generated documentation is not edited manually. Keep the specification and editable
  syntax documentation in the documentation source tree.

### Illustrative syntax

The following illustrates the proposed extension; it is not supported by the current renderer.

```text
ishikawa-beta
    Blurry Photo
    Equipment
        - Dirty lens
        Damaged sensor
    - Process
        Shutter speed too slow
```

Expected result: `Dirty lens` and `Process` are crossed out and each has one adjacent `×`.
`Shutter speed too slow` remains unmarked despite its eliminated parent. All items remain connected
in their original positions in the hierarchy.

## Acceptance Criteria

1. With either supported diagram header, `- Dirty lens` marks the item eliminated and displays
   `Dirty lens` without the authoring hyphen, with strike-through and exactly one adjacent `×`.
2. Recognition works for indented and unindented items and for multiple separating spaces/tabs.
   Adding or removing the prefix does not change the item's parent, child order, or branch identity.
3. Eliminated state is supported on the effect, top-level causes, and subcauses at multiple depths,
   on both sides of the spine and on horizontal/diagonal branches.
4. Unmarked labels remain unchanged. `-Cause`, `-5`, `--Cause`, a lone `-`, internal hyphens, and
   non-ASCII dashes remain literal labels with no elimination decoration.
5. An eliminated parent does not implicitly mark, hide, or remove any descendant. Duplicate labels
   can have different elimination states without affecting one another.
6. Every line of a wrapped/multiline eliminated label is crossed out. Exactly one symbol appears
   next to the label as a whole, outside the strike-through, without clipping or overlapping the
   label's text, box/head boundary, or connecting branch. Label measurements account for the symbol.
7. Eliminated items remain readable in default, dark, and forest themes and in standard and
   hand-drawn looks. Their meaning does not depend on color or an external icon resource.
8. Removing an item's prefix restores ordinary presentation. Rendering a subsequent unmarked
   diagram does not retain elimination state from a previous parse/render.
9. Existing comments, blank lines, indentation behavior, sanitization, and branch arrows continue
   to behave as before. Existing diagrams without the newly reserved prefix retain their behavior.
10. Syntax documentation includes a mixed-state example, exact prefix recognition rules, the
    non-cascading behavior, chosen symbol, and the compatibility warning for former `- ` labels.

## Verification Plan

- Parser/model tests prove recognized prefixes, preserved literal hyphens, trimmed label content,
  unchanged hierarchy, duplicate-label independence, and state reset. Include both headers,
  unindented causes, an effect indented more than its causes, and nested items.
- Browser assertions verify strike-through on all label lines, one undecorated symbol per marked
  item, and absence of decoration on unmarked items. Cover root, boxed causes, and nested label paths.
- Visual fixtures cover mixed states, eliminated parents with active children, long/wrapped labels,
  existing supported `<br>` line breaks, both sides of the spine, themes, and hand-drawn look.
  Check label/symbol bounds for clipping and overlap as well as screenshot appearance.
- Run existing Ishikawa unit and visual regressions to detect changes to ordinary diagrams;
  compare structure rather than requiring identical coordinates when decorated labels need more space.
- Review the syntax documentation against the example and acceptance criteria, and verify generated
  docs remain consistent using the repository's documentation checks.

## Rollback Plan

Remove the added `- ` prefixes from diagram sources to restore ordinary presentation. If the feature
is withdrawn, revert its syntax/rendering/documentation change together; older versions display the
hyphen as ordinary text rather than showing elimination state.

## Open Questions

- Should a bare prepended hyphen also work (`-Cause`), despite ambiguity with negative-number and
  existing hyphen-leading labels? This draft deliberately requires separating whitespace.
- Is `×` the preferred symbol, or should the initial release use `✔` instead? This draft selects
  `×`; symbol selection is not a configurable feature in the proposed initial scope.
- Should effect/root items be eligible, or should elimination be restricted to causes/subcauses?
  This draft treats any item as eligible to match the request's wording.
- Must authors retain a way to display a literal label beginning with `- `? No escape syntax is
  currently defined for Ishikawa; an explicit escape convention would need a separate decision.
