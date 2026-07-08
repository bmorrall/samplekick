import { describe, it, expect } from "vitest";
import { createNormaliseSpacesTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseSpacesTransformer integration", () => {
  it("applies createNormaliseSpacesTransformer to collapse multiple spaces", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums  Bass/kick.wav" }),
      createFileEntry({ path: "Hi Hats/hat.wav" }),
    ]);
    registry.applyTransform(createNormaliseSpacesTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Drums Bass [renamed, skipped]",
        "│   └── kick.wav [?]",
        "└── Hi Hats [skipped]",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
