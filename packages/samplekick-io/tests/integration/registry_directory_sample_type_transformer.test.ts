import { describe, it, expect } from "vitest";
import {
  createDirectorySampleTypeTransformer,
  createDirectorySubcategoryTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("DirectorySampleTypeTransformer integration", () => {
  it("applies createDirectorySampleTypeTransformer to tag known sample-type directories", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums/kick.wav" }),
      createFileEntry({ path: "Drums/One Shots/snare.wav" }),
      createFileEntry({ path: "Percussion/shaker.wav" }),
      createFileEntry({ path: "Bonks/lead.wav" }),
      createFileEntry({ path: "Loops/Drums/kick.wav" }),
      createFileEntry({ path: "Loops/Drums/Claps/clap.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Drums [type:Drums, skipped]",
        "│   ├── kick.wav [?]",
        "│   └── One Shots [type:Drum One Shots, skipped]",
        "│       └── snare.wav [?]",
        "├── Percussion [type:Percussion, skipped]",
        "│   └── shaker.wav [?]",
        "├── Bonks [skipped]",
        "│   └── lead.wav [?]",
        "└── Loops [type:Loops, skipped]",
        "    └── Drums [type:Drum Loops, skipped]",
        "        ├── kick.wav [?]",
        "        └── Claps [type:Clap Loops, skipped]",
        "            └── clap.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createDirectorySampleTypeTransformer to tag unrecognised subdirectory names under known-type parents", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drum Loops/Latin/Loop Stems/loop.wav" }),
      createFileEntry({
        path: "Melodies/Speed House/Loop Stems & MIDI/bass.wav",
      }),
      createFileEntry({ path: "Melodies/Sunset/Loop Stems & MIDI/reese.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createDirectorySubcategoryTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "├── Drum Loops [type:Drum Loops, skipped]",
        "│   └── Latin [type:Drum Loops - Latin, skipped]",
        "│       └── Loop Stems [skipped]",
        "│           └── loop.wav [?]",
        "└── Melodies [type:Melodies, skipped]",
        "    ├── Speed House [type:Melodies - Speed House, skipped]",
        "    │   └── Loop Stems & MIDI [skipped]",
        "    │       └── bass.wav [?]",
        "    └── Sunset [type:Melodies - Sunset, skipped]",
        "        └── Loop Stems & MIDI [skipped]",
        "            └── reese.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createDirectorySampleTypeTransformer to strip MIDI suffix from folder names", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drum Loops & MIDI/kick.wav" }),
      createFileEntry({ path: "Melodies/Speed House & MIDI/bass.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createDirectorySubcategoryTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "├── Drum Loops & MIDI [type:Drum Loops, skipped]",
        "│   └── kick.wav [?]",
        "└── Melodies [type:Melodies, skipped]",
        "    └── Speed House & MIDI [type:Melodies - Speed House, skipped]",
        "        └── bass.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies compound-tail resolution and subcategory tagging for brand-prefixed packs ending with a known type", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "Brand - Sci-Fi Horror FX & Foley/Alien Technology/alarm.wav",
      }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createDirectorySubcategoryTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Brand - Sci-Fi Horror FX & Foley [type:Foley, skipped]",
        "    └── Alien Technology [type:Foley - Alien Technology, skipped]",
        "        └── alarm.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
