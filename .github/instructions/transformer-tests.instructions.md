---
description: "Use when creating or modifying transformers in samplekick-io. Covers mandatory test requirements."
applyTo: "packages/samplekick-io/src/transformers/**"
---
# Transformer Test Requirements

Every transformer must be accompanied by tests at all three levels.

## Required test files

### 1. Unit test — `packages/samplekick-io/tests/unit/transformers/<name>.test.ts`

Test the transformer in isolation using helpers from `tests/support.ts`:

- `createTransformEntry(opts)` — creates a single mock `TransformEntry` with `vi.fn()` spies on all setters.
- `singleEntryTransformSource(entry)` — wraps one entry into a `TransformSource`.
- `createTransformEntryInHierarchy(parents, entry, children)` — creates an entry wired into a hierarchy; use this for transformers that inspect `getChildNodes()`.

Required cases:
- The happy path: transformer sets the expected value.
- Case-insensitivity where relevant (e.g. `.MID` as well as `.mid`).
- **Does not overwrite** an existing value (e.g. `sampleType` already set). Use `getOwnSampleType` guard where applicable.
- **Does not act** when the condition is not met (negative cases).
- If `setKeepStructure` is called, negative cases must also assert it was **not** called.
- For `createSanitiseNameTransformer`-based transformers: assert `packageName` and `sampleType` are also normalised, and that `keepStructure` / `skipped` entries are skipped.

### 2. Integration test — `packages/samplekick-io/tests/integration/`

Create a dedicated file named `registry_<transformer_name>.test.ts` in `packages/samplekick-io/tests/integration/`. Apply the transformer to a real `Registry` (via `createRegistry` + `createFileEntry` from `tests/support.ts`) and assert `registry.toString()` matches the expected tree string. Use `describe("<TransformerName> integration", () => { ... })` as the outer block.

### 3. CLI integration test — `packages/samplekick/tests/cli_<transformer_name>.test.ts`

Create a dedicated test file with a `spawnSync` test that runs the CLI with `--analyse` against a zip built with `fflate`'s `zipSync` / `strToU8`, writes it to a temp directory, and reads the saved CSV auto-config to assert the expected renamed paths / sampleType / keepPath values.

Pattern:
```ts
const CLI_PATH = resolve(import.meta.dirname, "../dist/index.mjs");
const zipped = zipSync({ "My \u2013 File/kick.wav": strToU8("data") });
const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-<name>-"));
// … writeFile, spawnSync with SAMPLEKICK_DATA_DIR, readdir, readFile …
// always rm(tmpDir, { recursive: true }) in a finally block
```

The CSV rows follow the format: `<original-path>,<name>,<packageName>,<sampleType>,<keepPath>,<skipped>`

## Exports

When adding a new transformer, also update:
- `packages/samplekick-io/src/transformers/index.ts` — add a named export.
- `packages/samplekick-io/src/index.ts` — include it in the public API export.
- `packages/samplekick-io/tests/unit/index.test.ts` — add a `test("exports <Name>")` assertion and add the name to the exhaustive export list.
- `packages/samplekick/src/index.ts` — import and wire into the analyse pipeline (see `transformer-implementation.instructions.md` for pipeline order).
- Rebuild the `samplekick-io` dist (`pnpm --filter samplekick-io build`) before running lint in the `samplekick` package — ESLint's type-awareness requires an up-to-date dist.
