import { describe, it, expect } from "vitest";
import { createTrimNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("TrimNameTransformer integration", () => {
  it("applies createTrimNameTransformer to strip leading and trailing whitespace", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: " Kicks/kick.wav" }),
      createFileEntry({ path: "Snares /snare.wav" }),
      createFileEntry({ path: "hi-hats/hat.wav" }),
    ]);
    registry.applyTransform(createTrimNameTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Kicks [renamed]",
        "│   └── kick.wav [?]",
        "├── Snares [renamed]",
        "│   └── snare.wav [?]",
        "└── hi-hats",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
