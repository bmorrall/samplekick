import { describe, it, expect } from "vitest";
import {
  createTruncateNameTransformer,
  createDefaultRootPackageNameTransformer,
  createDirectorySampleTypeTransformer,
  createSkipJunkTransformer,
  createKnownFileTypeTransformer,
  createAbletonProjectTransformer,
  createFLStudioProjectTransformer,
  createNormaliseBracketSpacingTransformer,
  createNormaliseCommaSpacingTransformer,
  createNormaliseQuotesTransformer,
  createGhosthackNameTransformer,
  createSquashNameTransformer,
  createExpandRootPackageNameTransformer,
  createNormaliseHyphenSpacingTransformer,
  createNormaliseSpacesTransformer,
  createTrimNameTransformer,
  OrganisedPathStrategy,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("Registry transforms", () => {
  it("applies createDefaultRootPackageNameTransformer to set package name on root node", () => {
    const registry = createRegistry("MyProject.zip", [
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/file2.wav" }),
      createFileEntry({ path: "sub2/file3.wav" }),
      createFileEntry({ path: "file4.wav" }),
    ]);
    registry.applyTransform(createDefaultRootPackageNameTransformer);
    expect(registry.toString()).toBe(
      [
        "MyProject.zip [pkg:MyProject]",
        "├── sub1",
        "│   ├── file1.wav [?]",
        "│   └── file2.wav [?]",
        "├── sub2",
        "│   └── file3.wav [?]",
        "└── file4.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createTruncateNameTransformer to truncate names while preserving extensions", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "short.wav" }),
      createFileEntry({ path: `${"x".repeat(90)}.wav` }),
      createFileEntry({ path: "x".repeat(90) }),
    ]);
    registry.applyTransform(createTruncateNameTransformer(80));
    expect(registry.toString()).toBe(
      [
        "root",
        `├── short.wav [?]`,
        `├── ${"x".repeat(76)}.wav [?] [renamed]`,
        `└── ${"x".repeat(80)} [?] [renamed]`,
        "",
      ].join("\n"),
    );
  });

  it("applies createSkipJunkTransformer to mark __MACOSX and hidden entries as skipped", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "__MACOSX/file1.wav" }),
      createFileEntry({ path: ".DS_Store" }),
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/.hidden" }),
    ]);
    registry.applyTransform(createSkipJunkTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── __MACOSX [skipped]",
        "│   └── ...",
        "├── .DS_Store [?] [skipped]",
        "└── sub1",
        "    ├── file1.wav [?]",
        "    └── .hidden [?] [skipped]",
        "",
      ].join("\n"),
    );
  });

  it("applies createKnownFileTypeTransformer to set sampleType on .mid and .fxp files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "beats/groove.mid" }),
      createFileEntry({ path: "presets/bass.fxp" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createKnownFileTypeTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── beats",
        "│   ┗━━ groove.mid [?] [type:MIDI]",
        "├── presets",
        "│   ┗━━ bass.fxp [?] [type:Serum Presets]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createAbletonProjectTransformer to tag Ableton project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Project/My Project.als" }),
      createFileEntry({ path: "My Project/Samples/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createAbletonProjectTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "┣━━ My Project [type:Ableton Projects]",
        "┃   ├── My Project.als [?]",
        "┃   └── Samples",
        "┃       └── kick.wav [?]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createFLStudioProjectTransformer to tag FL Studio project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Beat/My Beat.flp" }),
      createFileEntry({ path: "My Beat/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(createFLStudioProjectTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "┣━━ My Beat [type:FL Studio Projects]",
        "┃   ├── My Beat.flp [?]",
        "┃   └── kick.wav [?]",
        "└── samples",
        "    └── kick.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createNormaliseHyphenSpacingTransformer to fix hyphens touching adjacent words", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums- Bass/kick.wav" }),
      createFileEntry({ path: "Kicks -Snares/snare.wav" }),
      createFileEntry({ path: "Hi-Hats/hat.wav" }),
      createFileEntry({ path: "Drums-_Bass/kick.wav" }),
      createFileEntry({ path: "Kicks_-Snares/snare.wav" }),
    ]);
    registry.applyTransform(createNormaliseHyphenSpacingTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Drums - Bass [renamed]",
        "│   └── kick.wav [?]",
        "├── Kicks - Snares [renamed]",
        "│   └── snare.wav [?]",
        "├── Hi-Hats",
        "│   └── hat.wav [?]",
        "├── Drums_-_Bass [renamed]",
        "│   └── kick.wav [?]",
        "└── Kicks_-_Snares [renamed]",
        "    └── snare.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createNormaliseSpacesTransformer to collapse multiple spaces", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums  Bass/kick.wav" }),
      createFileEntry({ path: "Hi Hats/hat.wav" }),
    ]);
    registry.applyTransform(createNormaliseSpacesTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Drums Bass [renamed]",
        "│   └── kick.wav [?]",
        "└── Hi Hats",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createTrimNameTransformer to strip leading and trailing whitespace", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: " Kicks/kick.wav" }),
      createFileEntry({ path: "Snares /snare.wav" }),
      createFileEntry({ path: "hi-hats/hat.wav" }),
    ]);
    registry.applyTransform(createTrimNameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Kicks [renamed]",
        "│   └── kick.wav [?]",
        "├── Snares [renamed]",
        "│   └── snare.wav [?]",
        "└── hi-hats",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createExpandRootPackageNameTransformer to expand CamelCase packageName", () => {
    const registry = createRegistry("CoolPack-v2.zip", [
      createFileEntry({ path: "Drums/kick.wav" }),
    ]);
    registry.applyTransform(createDefaultRootPackageNameTransformer);
    registry.applyTransform(createExpandRootPackageNameTransformer);
    registry.setSampleType("drums");
    registry.setPathStrategy(OrganisedPathStrategy);
    expect(registry.destinationPathFor("Drums/kick.wav")).toBe("drums/Cool Pack - v2/kick.wav");
  });

  it("applies createNormaliseQuotesTransformer to replace curly quotes with straight quotes", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "\u2018Kicks\u2019/kick.wav" }),
      createFileEntry({ path: "\u201CSynths\u201D/pad.wav" }),
      createFileEntry({ path: "Drums/snare.wav" }),
    ]);
    registry.applyTransform(createNormaliseQuotesTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "\u251C\u2500\u2500 'Kicks' [renamed]",
        "\u2502   \u2514\u2500\u2500 kick.wav [?]",
        "\u251C\u2500\u2500 \"Synths\" [renamed]",
        "\u2502   \u2514\u2500\u2500 pad.wav [?]",
        "\u2514\u2500\u2500 Drums",
        "    \u2514\u2500\u2500 snare.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createNormaliseBracketSpacingTransformer to fix spacing around all SP404 bracket types", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "kick(hard)/sample.wav" }),
      createFileEntry({ path: "snare[soft]/sample.wav" }),
      createFileEntry({ path: "hi-hats{open}/sample.wav" }),
    ]);
    registry.applyTransform(createNormaliseBracketSpacingTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── kick (hard) [renamed]",
        "│   └── sample.wav [?]",
        "├── snare [soft] [renamed]",
        "│   └── sample.wav [?]",
        "└── hi-hats {open} [renamed]",
        "    └── sample.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createNormaliseCommaSpacingTransformer to fix spacing around commas", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Hihat , Kicks and Claps/hat.wav" }),
      createFileEntry({ path: "Kicks ,Snares/kick.wav" }),
      createFileEntry({ path: "Hihat_,_Kicks_and_Claps/hat.wav" }),
    ]);
    registry.applyTransform(createNormaliseCommaSpacingTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Hihat, Kicks and Claps [renamed]",
        "│   └── hat.wav [?]",
        "├── Kicks, Snares [renamed]",
        "│   └── kick.wav [?]",
        "└── Hihat,_Kicks_and_Claps [renamed]",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });

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

  it("applies createGhosthackNameTransformer to normalise Ghosthack prefixes", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Ghosthack-Bass Loops/Ghosthack-Bass Loop 01.wav" }),
      createFileEntry({ path: "Ghosthack -Drum Hits/Ghosthack -Snare Hit.wav" }),
      createFileEntry({ path: "Ghosthack_Synths/Ghosthack_Pad 01.wav" }),
      createFileEntry({ path: "Ghosthack - Pads/Ghosthack - Pad 01.wav" }),
      createFileEntry({ path: "Other Pack/hat.wav" }),
    ]);
    registry.applyTransform(createGhosthackNameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── Ghosthack - Bass Loops [renamed]",
        "│   └── Ghosthack - Bass Loop 01.wav [?] [renamed]",
        "├── Ghosthack - Drum Hits [renamed]",
        "│   └── Ghosthack - Snare Hit.wav [?] [renamed]",
        "├── Ghosthack - Synths [renamed]",
        "│   └── Ghosthack - Pad 01.wav [?] [renamed]",
        "├── Ghosthack - Pads",
        "│   └── Ghosthack - Pad 01.wav [?]",
        "└── Other Pack",
        "    └── hat.wav [?]",
        "",
      ].join("\n"),
    );
  });

  it("applies createSquashNameTransformer to convert names to camelCase", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Bass Loops/kick drum 01.wav" }),
      createFileEntry({ path: "Drum-Hits/Snare_hit.wav" }),
      createFileEntry({ path: "Other Pack/hat.wav" }),
      createFileEntry({ path: "Other Pack/Open_Hat.wav" }),
      createFileEntry({ path: "Other Pack/ride-cymbal.wav" }),
      createFileEntry({ path: "Other Pack/crash - cymbal.wav" }),
    ]);
    registry.applyTransform(createSquashNameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── BassLoops [renamed]",
        "│   └── kickDrum01.wav [?] [renamed]",
        "├── DrumHits [renamed]",
        "│   └── SnareHit.wav [?] [renamed]",
        "└── OtherPack [renamed]",
        "    ├── hat.wav [?]",
        "    ├── OpenHat.wav [?] [renamed]",
        "    ├── rideCymbal.wav [?] [renamed]",
        "    └── crashCymbal.wav [?] [renamed]",
        "",
      ].join("\n"),
    );
  });
});
