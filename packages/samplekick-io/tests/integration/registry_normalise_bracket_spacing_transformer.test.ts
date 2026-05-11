import { describe, it, expect } from "vitest";
import { createNormaliseBracketSpacingTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseBracketSpacingTransformer integration", () => {
  it("applies createNormaliseBracketSpacingTransformer to fix spacing around all bracket types", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "kick(hard)/sample.wav" }),
      createFileEntry({ path: "snare[soft]/sample.wav" }),
      createFileEntry({ path: "hi-hats{open}/sample.wav" }),
    ]);
    registry.applyTransform(createNormaliseBracketSpacingTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "├── kick (hard) [renamed]",
        "│   └── sample.wav [?]",
        "├── snare [soft] [renamed]",
        "│   └── sample.wav [?]",
        "└── hi-hats {open} [renamed]",
        "    └── sample.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
