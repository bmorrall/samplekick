import { describe, it, expect } from "vitest";
import { SP404Mk2NameTransformer, DefaultPackageNameTransformer, SkipJunkTransformer, KnownFileTypeTransformer, AbletonProjectTransformer, FLStudioProjectTransformer, NormaliseBracketSpacingTransformer, NormaliseHyphenTransformer, NormaliseSpacesTransformer, TrimNameTransformer } from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("Registry transforms", () => {
  it("applies DefaultPackageNameTransformer to set package name on root node", () => {
    const registry = createRegistry("MyProject.zip", [
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/file2.wav" }),
      createFileEntry({ path: "sub2/file3.wav" }),
      createFileEntry({ path: "file4.wav" }),
    ]);
    registry.applyTransform(DefaultPackageNameTransformer);
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

  it("applies SP404Mk2NameTransformer to entry names as expected", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "NáméWithÁccents.wav" }),
      createFileEntry({ path: "Invalid*Char?.mp3" }),
      createFileEntry({
        path: "ThisIsAVeryLongNameThatShouldBeTruncatedBecauseItIsWayTooLongToFitTheLimitOfEightyCharacters.wav",
      }),
      createFileEntry({ path: "Valid_Name-OK!.aif" }),
    ]);
    registry.applyTransform(SP404Mk2NameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── NameWithAccents.wav [?] [renamed]",
        "├── Invalid_Char_.mp3 [?] [renamed]",
        "├── ThisIsAVeryLongNameThatShouldBeTruncatedBecauseItIsWayTooLongToFitTheLimitOf.wav [?] [renamed]",
        "└── Valid_Name-OK!.aif [?]",
        "",
      ].join("\n"),
    );
  });

  it("does not rename entries inside a keepStructure folder when SP404Mk2NameTransformer is applied", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Mÿ Prøject/Mÿ Prøject.als" }),
      createFileEntry({ path: "Mÿ Prøject/Sämples/kick.wav" }),
      createFileEntry({ path: "Drums/snâre.wav" }),
    ]);
    registry.applyTransform(AbletonProjectTransformer);
    registry.applyTransform(SP404Mk2NameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "┣━━ Mÿ Prøject [type:Ableton Projects]",
        "┃   ├── Mÿ Prøject.als [?]",
        "┃   └── Sämples",
        "┃       └── kick.wav [?]",
        "└── Drums",
        "    └── snare.wav [?] [renamed]",
        "",
      ].join("\n"),
    );
  });

  it("applies SkipJunkTransformer to mark __MACOSX and hidden entries as skipped", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "__MACOSX/file1.wav" }),
      createFileEntry({ path: ".DS_Store" }),
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/.hidden" }),
    ]);
    registry.applyTransform(SkipJunkTransformer);
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

  it("applies KnownFileTypeTransformer to set sampleType on .mid and .fxp files", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "beats/groove.mid" }),
      createFileEntry({ path: "presets/bass.fxp" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(KnownFileTypeTransformer);
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

  it("applies AbletonProjectTransformer to tag Ableton project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Project/My Project.als" }),
      createFileEntry({ path: "My Project/Samples/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(AbletonProjectTransformer);
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

  it("applies FLStudioProjectTransformer to tag FL Studio project folders", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "My Beat/My Beat.flp" }),
      createFileEntry({ path: "My Beat/kick.wav" }),
      createFileEntry({ path: "samples/kick.wav" }),
    ]);
    registry.applyTransform(FLStudioProjectTransformer);
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

  it("applies NormaliseHyphenTransformer to fix hyphens touching adjacent words", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums- Bass/kick.wav" }),
      createFileEntry({ path: "Kicks -Snares/snare.wav" }),
      createFileEntry({ path: "Hi-Hats/hat.wav" }),
      createFileEntry({ path: "Drums-_Bass/kick.wav" }),
      createFileEntry({ path: "Kicks_-Snares/snare.wav" }),
    ]);
    registry.applyTransform(NormaliseHyphenTransformer);
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

  it("applies NormaliseSpacesTransformer to collapse multiple spaces", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Drums  Bass/kick.wav" }),
      createFileEntry({ path: "Hi Hats/hat.wav" }),
    ]);
    registry.applyTransform(NormaliseSpacesTransformer);
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

  it("applies TrimNameTransformer to strip leading and trailing whitespace", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: " Kicks/kick.wav" }),
      createFileEntry({ path: "Snares /snare.wav" }),
      createFileEntry({ path: "hi-hats/hat.wav" }),
    ]);
    registry.applyTransform(TrimNameTransformer);
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

  it("applies NormaliseBracketSpacingTransformer to fix spacing around all SP404 bracket types", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "kick(hard)/sample.wav" }),
      createFileEntry({ path: "snare[soft]/sample.wav" }),
      createFileEntry({ path: "hi-hats{open}/sample.wav" }),
    ]);
    registry.applyTransform(NormaliseBracketSpacingTransformer);
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
});
