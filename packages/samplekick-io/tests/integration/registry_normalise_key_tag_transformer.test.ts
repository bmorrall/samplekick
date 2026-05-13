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
        "root",
        "├── Loops Cmaj [renamed]",
        "│   └── piano.wav [?]",
        "├── Bass F#min [renamed]",
        "│   └── bass.wav [?]",
        "└── Drums",
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
        "root",
        "├── Loops C#min 120bpm [renamed]",
        "│   └── lead.wav [?]",
        "├── Loops 120bpm Emin [renamed]",
        "│   └── bass.wav [?]",
        "└── Chord Cm",
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
        "root",
        "├── Chords Cdim7 [renamed]",
        "│   └── lead.wav [?]",
        "├── Chords Chdim7 [renamed]",
        "│   └── lead.wav [?]",
        "└── Chords CminMaj7 [renamed]",
        "    └── lead.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
