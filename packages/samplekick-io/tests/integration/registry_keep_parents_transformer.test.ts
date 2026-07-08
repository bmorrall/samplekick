import { describe, it, expect } from "vitest";
import { createKeepParentsTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("KeepParentsTransformer integration", () => {
  it("sets keepStructure on all directories that have file children", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Kicks/kick.wav" }),
      createFileEntry({ path: "Snares/snare.wav" }),
    ]);
    registry.applyTransform(createKeepParentsTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "┣━━ Kicks",
        "┃   └── kick.wav [?]",
        "┗━━ Snares",
        "    └── snare.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("sets keepStructure on nested directories and their parents", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drums/Kicks/kick.wav" }),
      createFileEntry({ path: "Drums/Snares/snare.wav" }),
    ]);
    registry.applyTransform(createKeepParentsTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Drums [skipped]",
        "    ┣━━ Kicks",
        "    ┃   └── kick.wav [?]",
        "    ┗━━ Snares",
        "        └── snare.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("sets keepStructure only on directories with direct file children, leaving ancestor-only directories unset so they appear in the config", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Guitar Pack/samples/guitar_stuff/guitar.wav" }),
      createFileEntry({ path: "Guitar Pack/samples/readme.txt" }),
    ]);
    registry.applyTransform(createKeepParentsTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Guitar Pack [skipped]",
        "    ┗━━ samples",
        "        ┣━━ guitar_stuff",
        "        ┃   └── guitar.wav [?]",
        "        └── readme.txt [?]",
        "",
      ].join("\n"),
    );
  });

  describe("levels=2", () => {
    it("also keeps ancestor directories up to 2 levels above file children", () => {
      const registry = createRegistry("Pack.zip", [
        createFileEntry({ path: "Drums/Kicks/kick.wav" }),
        createFileEntry({ path: "Drums/Snares/snare.wav" }),
      ]);
      registry.applyTransform(createKeepParentsTransformer(2));
      expect(registry.toString()).toBe(
        [
          "Pack.zip [skipped]",
          "┗━━ Drums",
          "    ┣━━ Kicks",
          "    ┃   └── kick.wav [?]",
          "    ┗━━ Snares",
          "        └── snare.wav [?]",
          "",
        ].join("\n"),
      );
    });
  });
});
