import { describe, it, expect } from "vitest";
import { SP404Mk2NameTransformer, DefaultPackageNameTransformer, SkipJunkTransformer, KnownFileTypeTransformer, AbletonProjectTransformer, FLStudioProjectTransformer } from "../../src";
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
        "│   ├── file1.wav",
        "│   └── file2.wav",
        "├── sub2",
        "│   └── file3.wav",
        "└── file4.wav",
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
        "├── NameWithAccents.wav [renamed]",
        "├── Invalid_Char_.mp3 [renamed]",
        "├── ThisIsAVeryLongNameThatShouldBeTruncatedBecauseItIsWayTooLongToFitTheLimitOf.wav [renamed]",
        "└── Valid_Name_OK!.aif [renamed]",
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
        "│   └── file1.wav [skipped]",
        "├── .DS_Store [skipped]",
        "└── sub1",
        "    ├── file1.wav",
        "    └── .hidden [skipped]",
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
        "│   └── groove.mid [type:MIDI]",
        "├── presets",
        "│   └── bass.fxp [type:Serum Presets]",
        "└── samples",
        "    └── kick.wav",
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
        "┃   ├── My Project.als",
        "┃   └── Samples",
        "┃       └── kick.wav",
        "└── samples",
        "    └── kick.wav",
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
        "┃   ├── My Beat.flp",
        "┃   └── kick.wav",
        "└── samples",
        "    └── kick.wav",
        "",
      ].join("\n"),
    );
  });
});
