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
        "Pack.zip",
        "┣━━ Kicks",
        "┃   ┗━━ kick.wav [?]",
        "┗━━ Snares",
        "    ┗━━ snare.wav [?]",
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
        "Pack.zip",
        "└── Drums",
        "    ┣━━ Kicks",
        "    ┃   ┗━━ kick.wav [?]",
        "    ┗━━ Snares",
        "        ┗━━ snare.wav [?]",
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
        "Pack.zip",
        "└── Guitar Pack",
        "    ┗━━ samples",
        "        ┣━━ guitar_stuff",
        "        ┃   ┗━━ guitar.wav [?]",
        "        ┗━━ readme.txt [?]",
        "",
      ].join("\n"),
    );
  });
});
