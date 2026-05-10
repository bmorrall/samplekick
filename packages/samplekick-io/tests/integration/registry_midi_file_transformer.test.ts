import { describe, it, expect } from "vitest";
import { createMidiFileTransformer, createDirectorySampleTypeTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("MidiFileTransformer integration", () => {
  it("sets sampleType to MIDI for a .mid file with no parent type", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "beats/groove.mid" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createMidiFileTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── beats",
        "│   ┗━━ groove.mid [?] [type:MIDI]",
        "└── samples",
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
    registry.applyTransform(createDirectorySampleTypeTransformer);
    registry.applyTransform(createMidiFileTransformer);
    expect(registry.toString()).toBe(
      [
        "Pack.zip",
        "└── Drum Loops [type:Drum Loops]",
        "    ┣━━ groove.mid [?] [type:MIDI - Drum Loops]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
