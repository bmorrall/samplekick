# samplekick

Monorepo for the samplekick project.

## Packages

- [`samplekick`](./packages/samplekick) — CLI for processing and normalising music sample packs.
- [`samplekick-io`](./packages/samplekick-io) — Core library for processing sample packs from zip archives.

## Development

Install dependencies:

```sh
pnpm install
```

Run all tests:

```sh
pnpm run test
```

Run linting, type-checking, and tests:

```sh
pnpm run check
```

## Releasing

1. **Ensure everything passes:**

   ```sh
   pnpm run check
   ```

2. **Bump versions** — from the root, run bumpp across all packages:

   ```sh
   pnpm run release
   ```

   This will prompt you for the new version of each package, update `package.json`, commit, tag, and push.

3. **Publish to npm:**

   ```sh
   pnpm -r publish --access public
   ```

   pnpm will automatically replace `workspace:*` dependency references with real version numbers before publishing.
