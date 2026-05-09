import { describe, it, expect } from "vitest";
import { createDirectorySampleTypeTransformer, createDirectorySubcategoryTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("DirectorySubcategoryTransformer integration", () => {
  it("tags unrecognised child directories under known-type parents", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drum Loops/Latin/loop.wav" }),
      createFileEntry({ path: "Melodies/Speed House/melody.wav" }),
      createFileEntry({ path: "Bonks/Unknown/lead.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer);
    registry.applyTransform(createDirectorySubcategoryTransformer);
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "├── Drum Loops [type:Drum Loops]",
        "│   └── Latin [type:Drum Loops - Latin]",
        "│       └── loop.wav [?]",
        "├── Melodies [type:Melodies]",
        "│   └── Speed House [type:Melodies - Speed House]",
        "│       └── melody.wav [?]",
        "└── Bonks",
        "    └── Unknown",
        "        └── lead.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("strips & MIDI and & Stems suffixes from the subcategory display name", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drum Loops/Latin & Stems/loop.wav" }),
      createFileEntry({ path: "Melodies/Speed House & MIDI/melody.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer);
    registry.applyTransform(createDirectorySubcategoryTransformer);
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "├── Drum Loops [type:Drum Loops]",
        "│   └── Latin & Stems [type:Drum Loops - Latin]",
        "│       └── loop.wav [?]",
        "└── Melodies [type:Melodies]",
        "    └── Speed House & MIDI [type:Melodies - Speed House]",
        "        └── melody.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not tag children whose names end with Stems or Steps", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drum Loops/Loop Stems/loop.wav" }),
      createFileEntry({ path: "Drum Loops/Loop Steps/loop.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer);
    registry.applyTransform(createDirectorySubcategoryTransformer);
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "└── Drum Loops [type:Drum Loops]",
        "    ├── Loop Stems",
        "    │   └── loop.wav [?]",
        "    └── Loop Steps",
        "        └── loop.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("resolves subcategory-preferred keys (808s/909s) using the parent type derived from the folder name", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drums/808s/808.wav" }),
      createFileEntry({ path: "Drums/909s/909.wav" }),
      createFileEntry({ path: "Drum Loops/808s/808.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer);
    registry.applyTransform(createDirectorySubcategoryTransformer);
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "├── Drums [type:Drums]",
        "│   ├── 808s [type:Drums - 808s]",
        "│   │   └── 808.wav [?]",
        "│   └── 909s [type:Drums - 909s]",
        "│       └── 909.wav [?]",
        "└── Drum Loops [type:Drum Loops]",
        "    └── 808s [type:Drum Loops - 808s]",
        "        └── 808.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
