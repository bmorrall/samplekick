import { describe, it, expect } from "vitest";
import { createDirectorySampleTypeTransformer } from "../../src";
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
    registry.applyTransform(createDirectorySampleTypeTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Drums [type:Drums]",
        "│   ├── kick.wav [?]",
        "│   └── One Shots [type:Drum One Shots]",
        "│       └── snare.wav [?]",
        "├── Percussion [type:Percussion]",
        "│   └── shaker.wav [?]",
        "├── Bonks",
        "│   └── lead.wav [?]",
        "└── Loops [type:Loops]",
        "    └── Drums [type:Drum Loops]",
        "        ├── kick.wav [?]",
        "        └── Claps [type:Clap Loops]",
        "            └── clap.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createDirectorySampleTypeTransformer to tag unrecognised subdirectory names under known-type parents", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drum Loops/Latin/Loop Stems/loop.wav" }),
      createFileEntry({ path: "Melodies/Speed House/Loop Stems & MIDI/bass.wav" }),
      createFileEntry({ path: "Melodies/Sunset/Loop Stems & MIDI/reese.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer);
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "├── Drum Loops [type:Drum Loops]",
        "│   └── Latin [type:Drum Loops - Latin]",
        "│       └── Loop Stems",
        "│           └── loop.wav [?]",
        "└── Melodies [type:Melodies]",
        "    ├── Speed House [type:Melodies - Speed House]",
        "    │   └── Loop Stems & MIDI",
        "    │       └── bass.wav [?]",
        "    └── Sunset [type:Melodies - Sunset]",
        "        └── Loop Stems & MIDI",
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
    registry.applyTransform(createDirectorySampleTypeTransformer);
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "├── Drum Loops & MIDI [type:Drum Loops]",
        "│   └── kick.wav [?]",
        "└── Melodies [type:Melodies]",
        "    └── Speed House & MIDI [type:Melodies - Speed House]",
        "        └── bass.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
