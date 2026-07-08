import { describe, it, expect } from "vitest";
import { createNormaliseCommaSpacingTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseCommaSpacingTransformer integration", () => {
  it("applies createNormaliseCommaSpacingTransformer to fix spacing around commas", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Hihat , Kicks and Claps/hat.wav" }),
      createFileEntry({ path: "Kicks ,Snares/kick.wav" }),
      createFileEntry({ path: "Hihat_,_Kicks_and_Claps/hat.wav" }),
    ]);
    registry.applyTransform(createNormaliseCommaSpacingTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Hihat, Kicks and Claps [renamed, skipped]",
        "│   └── hat.wav [?]",
        "├── Kicks, Snares [renamed, skipped]",
        "│   └── kick.wav [?]",
        "└── Hihat,_Kicks_and_Claps [renamed, skipped]",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
