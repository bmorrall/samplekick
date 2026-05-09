import { describe, it, expect } from "vitest";
import { createDefaultRootPackageNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("DefaultRootPackageNameTransformer integration", () => {
  it("applies createDefaultRootPackageNameTransformer to set package name on root node", () => {
    const registry = createRegistry("MyProject.zip", [
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/file2.wav" }),
      createFileEntry({ path: "sub2/file3.wav" }),
      createFileEntry({ path: "file4.wav" }),
    ]);
    registry.applyTransform(createDefaultRootPackageNameTransformer);
    expect(registry.toString()).toBe(
      [
        "MyProject.zip [pkg:MyProject]",
        "├── sub1",
        "│   ├── file1.wav [?]",
        "│   └── file2.wav [?]",
        "├── sub2",
        "│   └── file3.wav [?]",
        "└── file4.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
