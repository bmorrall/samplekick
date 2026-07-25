import { describe, it, expect } from "vitest";
import { createStripLeadingBracketTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("StripLeadingBracketTransformer integration", () => {
  it("strips a leading bracket pair left behind after prefix stripping", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Snares/(Counter).wav" }),
      createFileEntry({ path: "Snares/(Creep) - D#.wav" }),
      createFileEntry({ path: "Snares/REESE Fuzzy (C).wav" }),
    ]);
    registry.applyTransform(createStripLeadingBracketTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Snares [skipped]",
        "    ├── Counter.wav [?] [renamed]",
        "    ├── Creep - D#.wav [?] [renamed]",
        "    └── REESE Fuzzy (C).wav [?]",
        "",
      ].join("\n"),
    );
  });
});
