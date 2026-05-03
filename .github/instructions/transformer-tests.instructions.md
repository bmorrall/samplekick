---
description: "Use when creating or modifying transformers in samplekick-io. Covers mandatory test requirements."
applyTo: "packages/samplekick-io/src/transformers/**"
---
# Transformer Test Requirements

Every transformer must be accompanied by tests at all three levels.

## Required test files

### 1. Unit test — `packages/samplekick-io/tests/unit/transformers/<name>.test.ts`

Test the transformer in isolation using `createTransformEntry` / `singleEntryTransformSource` from `tests/support.ts`.

Required cases:
- The happy path: transformer sets the expected value.
- Case-insensitivity where relevant (e.g. `.MID` as well as `.mid`).
- **Does not overwrite** an existing value (e.g. `sampleType` already set).
- **Does not act** when the condition is not met (negative cases).
- If `setKeepStructure` is called, negative cases must also assert it was **not** called.

### 2. Integration test — `packages/samplekick-io/tests/integration/registry_transforms.test.ts`

Add a `it(...)` block that applies the transformer to a real `Registry` and asserts `registry.toString()` matches the expected tree string. This confirms the transformer wires up correctly end-to-end.

### 3. CLI integration test — `packages/samplekick/tests/cli_<transformer_name>.test.ts`

Create a dedicated test file (e.g. `cli_ableton_project.test.ts`) with a `spawnSync` test that runs the CLI with `--analyse` against a zip containing the relevant file/folder structure and reads the saved CSV auto-config to assert the expected `sampleType` / `keepPath` values are present.

## Exports

When adding a new transformer, also update:
- `packages/samplekick-io/src/transformers/index.ts` — export the transformer.
- `packages/samplekick-io/src/index.ts` — include it in the public API export.
- `packages/samplekick-io/tests/unit/index.test.ts` — add a `test("exports <Name>")` assertion and add the name to the exhaustive export list.
