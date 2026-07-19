import { describe, it, expect } from "vitest";
import { createStripCommonPrefixTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("StripCommonPrefixTransformer integration", () => {
  it("strips the common prefix from audio files in a subdirectory", () => {
    const registry = createRegistry("root", [
      createFileEntry({
        path: "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Bass Loop Gmin 140bpm.wav",
      }),
      createFileEntry({
        path: "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Chords Loop Gmin 140bpm.wav",
      }),
      createFileEntry({
        path: "OSS Kit Aftershock/Ghosthack - OSS Kit Aftershock Pad Loop Gmin 140bpm.wav",
      }),
    ]);
    registry.applyTransform(createStripCommonPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── OSS Kit Aftershock [skipped]",
        "    ├── Bass Loop Gmin 140bpm.wav [?] [renamed]",
        "    ├── Chords Loop Gmin 140bpm.wav [?] [renamed]",
        "    └── Pad Loop Gmin 140bpm.wav [?] [renamed]",
        "",
      ].join("\n"),
    );
  });

  it("does not strip at root level (flat packs handled separately)", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Brand Kit Bass.wav" }),
      createFileEntry({ path: "Brand Kit Snare.wav" }),
    ]);
    registry.applyTransform(createStripCommonPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "├── Brand Kit Bass.wav [?]",
        "└── Brand Kit Snare.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("strips underscore-delimited prefixes in subdirectories", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums/KIT_001_Kick.wav" }),
      createFileEntry({ path: "Drums/KIT_001_Snare.wav" }),
      createFileEntry({ path: "Drums/KIT_001_HiHat.wav" }),
    ]);
    registry.applyTransform(createStripCommonPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Drums [skipped]",
        "    ├── Kick.wav [?] [renamed]",
        "    ├── Snare.wav [?] [renamed]",
        "    └── HiHat.wav [?] [renamed]",
        "",
      ].join("\n"),
    );
  });

  it("does not strip when files share no word-boundary prefix", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums/Alpha.wav" }),
      createFileEntry({ path: "Drums/Bravo.wav" }),
    ]);
    registry.applyTransform(createStripCommonPrefixTransformer());
    expect(registry.toString()).toBe(
      [
        "root [skipped]",
        "└── Drums [skipped]",
        "    ├── Alpha.wav [?]",
        "    └── Bravo.wav [?]",
        "",
      ].join("\n"),
    );
  });
});
