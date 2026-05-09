import { describe, it, expect } from "vitest";
import { createSkipJunkTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("SkipJunkTransformer integration", () => {
  it("applies createSkipJunkTransformer to mark __MACOSX and hidden entries as skipped", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "__MACOSX/file1.wav" }),
      createFileEntry({ path: ".DS_Store" }),
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/.hidden" }),
    ]);
    registry.applyTransform(createSkipJunkTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── __MACOSX [skipped]",
        "│   └── ...",
        "├── .DS_Store [?] [skipped]",
        "└── sub1",
        "    ├── file1.wav [?]",
        "    └── .hidden [?] [skipped]",
        "",
      ].join("\n"),
    );
  });
});
