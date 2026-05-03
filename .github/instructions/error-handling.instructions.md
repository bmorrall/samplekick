---
description: "Use when adding or modifying classes/modules used by the CLI (index.ts). Covers mandatory onError callback pattern."
applyTo: "packages/samplekick/src/**"
---
# Error Handling Pattern for CLI Modules

Classes and modules consumed by the CLI (`packages/samplekick/src/index.ts`) must require callers to supply error handling explicitly — no silent swallowing and no built-in fallbacks.

## Rules

- **`onError` must be a required field** in the options object, not optional (`?`) and no default.
- **Never provide a `defaultErrorHandler`** inside the module. The default encourages callers to skip thinking about errors.
- **Pass errors up as `Error` objects**, not strings. Normalise at the throw site: `err instanceof Error ? err : new Error(String(err))`.
- **`onError` belongs in the options object**, not as a separate constructor parameter, so all configuration is grouped in one place.

## Pattern

```ts
export interface MyModuleOptions {
  // required — caller must decide what to do with errors
  onError: (context: string, error: Error) => void;
  onDebug?: (message: string) => void;
  // ... other options
}

export class MyModule implements SomeInterface {
  private readonly onError: (context: string, error: Error) => void;

  constructor(
    dependency: SomeDependency = defaultDependency,
    options: MyModuleOptions,
  ) {
    this.onError = options.onError;
    // ...
  }
}
```

## Rationale

The CLI (`index.ts`) owns the UX decision — it knows whether to warn, log, or abort. Modules don't. Forcing `onError` to be required makes that contract explicit at the type level and prevents silent failures in production.
