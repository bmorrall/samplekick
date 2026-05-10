import { describe, it, expect } from "vitest";
import { createMidiFileTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("MidiFileTransformer integration", () => {
  it("applies createMidiFileTransformer to set sampleType on .mid files", () => {
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
});
