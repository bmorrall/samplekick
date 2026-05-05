---
description: "Use when adding or modifying terms in directory_sample_type_transformer.ts."
applyTo: "packages/samplekick-io/src/transformers/directory_sample_type_transformer.ts"
---
# Directory Sample Type — Term Test Requirements

Whenever a term is added to `FOLDER_SINGULAR_LOOKUP` or `FOLDER_PLURAL_LOOKUP`, the corresponding test file must be updated:

`packages/samplekick-io/tests/unit/transformers/directory_sample_type_transformer.test.ts`

## Rules by lookup

### `FOLDER_PLURAL_LOOKUP` only (e.g. `sound fx`, `melodies`)
Add a `describe` block with:
- Happy path: folder name sets the expected `sampleType`.
- Case-insensitive match.

### `FOLDER_SINGULAR_LOOKUP` only (e.g. `melody` — loops/one-shots base only, no bare folder)
No bare-folder test. The term will be exercised implicitly by the Loops / One Shots test suites. Add a **negative** test asserting a bare folder with that name does **not** set a `sampleType`, under the `"when the directory name does not match any known sampleType"` describe block.

### Both lookups (e.g. `bass`/`basses`, `drum`/`drums`)
Add a `describe` block with:
- Happy path using the plural form sets the expected `sampleType`.
- Happy path using the singular form sets the same `sampleType`.
- Case-insensitive match.
