import { describe, it, expect } from "vitest";
import {
  createMidiFileTransformer,
  createDirectorySampleTypeTransformer,
  createDirectorySubcategoryTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("MidiFileTransformer integration", () => {
  it("sets sampleType to MIDI for a .mid file with no parent type", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "beats/groove.mid" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createMidiFileTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── beats [skipped]",
        "│   └── groove.mid [?] [type:MIDI]",
        "└── samples [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("prefixes the parent directory sampleType with MIDI -", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Drum Loops/groove.mid" }),
      createFileEntry({ path: "Drum Loops/kick.wav" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createMidiFileTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Drum Loops [type:Drum Loops, skipped]",
        "    ├── groove.mid [?] [type:MIDI - Drum Loops]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("inherits the ancestor sampleType when nested under a transparent MIDI directory — avoids double-prefix", () => {
    const registry = createRegistry("Pack.zip", [
      createFileEntry({ path: "Melodies/MIDI/groove.mid" }),
    ]);
    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createDirectorySubcategoryTransformer());
    registry.applyTransform(createMidiFileTransformer());
    expect(registry.toString()).toBe(
      [
        "Pack.zip [skipped]",
        "└── Melodies [type:Melodies, skipped]",
        "    └── MIDI [skipped]",
        "        └── groove.mid [?] [type:MIDI - Melodies]",
        "",
      ].join("\n"),
    );
  });
});
