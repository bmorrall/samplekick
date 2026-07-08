import { describe, it, expect } from "vitest";
import { createMultiPackNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("MultiPackNameTransformer integration", () => {
  it("tags directories whose name contains ' - ' when the parent name does not", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Vendor - Top Level Pack/Sub Category/Vendor - Sub Pack/file.wav",
      }),
      createFileEntry({
        path: "Vendor - Top Level Pack/Holiday Kit 01 - 100bpm/file.wav",
      }),
    ]);
    registry.applyTransform(createMultiPackNameTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Vendor - Top Level Pack [pkg:Vendor - Top Level Pack, skipped]",
        "    ├── Sub Category [skipped]",
        "    │   └── Vendor - Sub Pack [pkg:Vendor - Sub Pack, skipped]",
        "    │       └── file.wav [?]",
        "    └── Holiday Kit 01 - 100bpm [pkg:Holiday Kit 01 - 100bpm, skipped]",
        "        └── file.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
