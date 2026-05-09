import { describe, it, expect } from "vitest";
import { createTruncateNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("TruncateNameTransformer integration", () => {
  it("applies createTruncateNameTransformer to truncate names while preserving extensions", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "short.wav" }),
      createFileEntry({ path: `${"x".repeat(90)}.wav` }),
      createFileEntry({ path: "x".repeat(90) }),
    ]);
    registry.applyTransform(createTruncateNameTransformer(80));
    expect(registry.toString()).toBe(
      [
        "root",
        `├── short.wav [?]`,
        `├── ${"x".repeat(76)}.wav [?] [renamed]`,
        `└── ${"x".repeat(80)} [?] [renamed]`,
        "",
      ].join("\n"),
    );
  });
});
