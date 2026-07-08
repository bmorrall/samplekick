import { describe, it, expect } from "vitest";
import { createNormaliseKeyTagTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("NormaliseKeyTagTransformer integration", () => {
  it("applies createNormaliseKeyTagTransformer to normalise key tags in folder names", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Loops C Major/piano.wav" }),
      createFileEntry({ path: "Bass F# Minor/bass.wav" }),
      createFileEntry({ path: "Drums/kick.wav" }),
    ]);
    registry.applyTransform(createNormaliseKeyTagTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Loops Cmaj [renamed, skipped]",
        "│   └── piano.wav [?]",
        "├── Bass F#min [renamed, skipped]",
        "│   └── bass.wav [?]",
        "└── Drums [skipped]",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("normalises bare Xm when adjacent to a BPM tag", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Loops C#m 120bpm/lead.wav" }),
      createFileEntry({ path: "Loops 120bpm Em/bass.wav" }),
      createFileEntry({ path: "Chord Cm/piano.wav" }),
    ]);
    registry.applyTransform(createNormaliseKeyTagTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Loops C#min 120bpm [renamed, skipped]",
        "│   └── lead.wav [?]",
        "├── Loops 120bpm Emin [renamed, skipped]",
        "│   └── bass.wav [?]",
        "└── Chord Cm [skipped]",
        "    └── piano.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("normalises degree °, half-diminished ø, and minor-major mMaj forms", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Chords C°7/lead.wav" }),
      createFileEntry({ path: "Chords Cø7/lead.wav" }),
      createFileEntry({ path: "Chords CmMaj7/lead.wav" }),
    ]);
    registry.applyTransform(createNormaliseKeyTagTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Chords Cdim7 [renamed, skipped]",
        "│   └── lead.wav [?]",
        "├── Chords Chdim7 [renamed, skipped]",
        "│   └── lead.wav [?]",
        "└── Chords CminMaj7 [renamed, skipped]",
        "    └── lead.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
