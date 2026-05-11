---
description: "Use when implementing a new transformer in samplekick-io. Covers the Transform type, the two traversal methods, naming conventions, the sanitise-name factory, the two-pass pattern for structural transforms, and ESLint rules to respect."
applyTo: "packages/samplekick-io/src/transformers/**"
---
# Transformer Implementation Guide

## Core type

```ts
interface Transform {
  transform: (source: TransformSource) => void;
}
```

All transformers are objects implementing the `Transform` interface. Always export the transformer as a `const`:

```ts
export const createMyTransformer: Transform = {
  transform: (source) => { … },
};
```

The `create` prefix is used even for singleton transforms (no factory function needed unless the transformer is parameterised, e.g. `createTruncateNameTransformer(maxLength)`).

---

## Two traversal methods

`TransformSource` exposes two methods. Choose the right one:

| Method | Visits | `setName` available? | Use for |
|---|---|---|---|
| `eachTransformEntry` | **every** node including root, skipped, and keepStructure | No | Reading structure (children, extensions, sampleType); calling `setSampleType`, `setKeepStructure`, `setSkipped`, `setPackageName` on directories |
| `eachTransformModification` | Non-keepStructure, non-skipped nodes only | Yes | String normalisation — renaming entries via `setName`, `setPackageName`, `setSampleType` |

### Important constraints

- **`getChildNodes()` returns `FileNode[]`**, not `TransformEntry[]`. You cannot call `setName` on children from inside `eachTransformEntry`. Use the two-pass pattern (see below) when you need to both inspect structure and rename children.
- **`getParentNode()`** returns `FileNode | undefined`. The root node has no parent.
- `eachTransformModification` automatically skips entries where `isKeepStructure() === true` or `isSkipped() === true`.

---

## String-only transformers: use `createSanitiseNameTransformer`

For transformers that apply a pure string→string function to `name`, `packageName`, and `sampleType`, use the factory:

```ts
import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const myFn: StringTransformer = (name: string): string => /* … */;

export const createMyTransformer: Transform = createSanitiseNameTransformer(myFn);
```

`createSanitiseNameTransformer` uses `eachTransformModification` internally, so it automatically skips keepStructure and skipped entries, and applies the function to all three fields when present.

---

## Structural transforms: the two-pass pattern

When a transformer needs to **inspect directory structure** (first pass) and **rename children** (second pass), use a `Map` to bridge the two passes:

```ts
export const createMyTransformer: Transform = {
  transform: (source) => {
    const actionByParentPath = new Map<string, string>();

    // Pass 1: read structure, populate the map
    source.eachTransformEntry((entry) => {
      // guard: root only, or other structural checks
      if (entry.getParentNode() !== undefined) return;
      // … inspect entry.getChildNodes() …
      // call entry.setSampleType / setPackageName / setKeepStructure as needed
      actionByParentPath.set(entry.getPath(), someValue);
    });

    // Pass 2: rename children using TransformEntry objects
    source.eachTransformModification((entry) => {
      const parent = entry.getParentNode();
      if (parent === undefined) return;
      const value = actionByParentPath.get(parent.getPath());
      if (value === undefined) return;
      // … entry.setName(…) …
    });
  },
};
```

---

## Guard patterns

Apply these guards early in `eachTransformEntry` callbacks to avoid acting on the wrong nodes:

```ts
// Only act if sampleType not already set (respect existing config)
if (entry.getOwnSampleType() !== undefined) return;

// Only act on the root node
if (entry.getParentNode() !== undefined) return;

// Only act on files
if (!entry.isFile()) return;

// Only act on directories with children
const children = entry.getChildNodes();
if (children.length === 0) return;
```

Use `getOwnSampleType()` (not `getSampleType()`) to check the entry's own value without inheritance.

---

## ESLint rules to respect

- **`no-magic-numbers`**: extract all non-obvious numeric or string literals as named constants (`const NOT_FOUND = -1`, `const MIN_AUDIO_FILES = 2`).
- **`no-plusplus`**: use `j += 1` not `j++`.
- **`@typescript-eslint/prefer-destructuring`**: destructure arrays and objects where possible (`const [first, ...rest] = strings`).
- **`@typescript-eslint/strict-void-return`**: callbacks passed to `eachTransformEntry` / `eachTransformModification` must return `void`. Type `vi.fn()` explicitly in tests: `vi.fn<() => void>()`.

---

## CLI pipeline order

Transformers are applied in this order in `packages/samplekick/src/index.ts`:

1. `createSkipJunkTransformer` — mark `__MACOSX` and hidden files as skipped
2. `createTrimNameTransformer` — trim leading/trailing whitespace
3. `createNormaliseQuotesTransformer` — normalise fancy quotes
4. `createNormaliseDashesTransformer` — normalise non-ASCII dashes to hyphen-minus
5. `createKnownFileTypeTransformer` — detect MIDI / presets, set sampleType + keepStructure
6. `createAbletonProjectTransformer` — detect Ableton project folders
7. `createFLStudioProjectTransformer` — detect FL Studio project folders
8. `createDefaultRootPackageNameTransformer` — derive package name from zip filename
9. `createExpandRootPackageNameTransformer` — expand abbreviations in root package name
10. `createGhosthackNameTransformer` — strip Ghosthack pack-name prefix from sample names
11. `createNormaliseSpacesTransformer` — collapse multiple spaces
12. `createNormaliseBracketSpacingTransformer` — fix spacing around brackets
13. `createNormaliseCommaSpacingTransformer` — fix spacing around commas
14. `createNormaliseHyphenSpacingTransformer` — fix spacing around hyphens
15. `createDirectorySampleTypeTransformer` — map folder names to known sampleType values
16. `createFlatPackPrefixTransformer` — detect flat-pack zips, set packageName / sampleType, strip prefix

**When adding a new transformer**, insert it at the logically correct position:
- Pre-processing (trim/normalise raw characters): after step 2, before step 5.
- File-type detection: between steps 5–7.
- Name normalisation: between steps 10–14.
- Directory/structural classification: between steps 15–16.
