import { describe, it, expect } from "vitest";
import { createSP404Mk2ProjectTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("SP404Mk2ProjectTransformer integration", () => {
  it("applies createSP404Mk2ProjectTransformer to tag SP-404MKII project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "MY_PROJECT/SMPL/BANK1-01.SMP" }),
      createFileEntry({ path: "MY_PROJECT/PTN/PATTERNCHAIN_00.CHN" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createSP404Mk2ProjectTransformer());
    expect(registry.toString()).toBe(
      [
        "root",
        "┣━━ MY_PROJECT [type:SP-404MKII Projects]",
        "┃   ├── SMPL",
        "┃   │   └── BANK1-01.SMP [?]",
        "┃   └── PTN",
        "┃       └── PATTERNCHAIN_00.CHN [?]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
