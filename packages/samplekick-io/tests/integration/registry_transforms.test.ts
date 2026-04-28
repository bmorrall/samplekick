import { describe, it, expect } from "vitest";
import { Registry } from "../../src/registry";
import { SP404Mk2NameTransformer, DefaultPackageNameTransformer, SkipJunkTransformer } from "../../src";
import { loadRegistry, createFileEntry } from "../support";

describe("Registry transforms", () => {
  it("applies DefaultPackageNameTransformer to set package name on root node", () => {
    const entries = [
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/file2.wav" }),
      createFileEntry({ path: "sub2/file3.wav" }),
      createFileEntry({ path: "file4.wav" }),
    ];
    const registry = new Registry("MyProject.zip");
    loadRegistry(registry, entries);
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
    const entries = [
      createFileEntry({ path: "NáméWithÁccents.wav" }),
      createFileEntry({ path: "Invalid*Char?.mp3" }),
      createFileEntry({
        path: "ThisIsAVeryLongNameThatShouldBeTruncatedBecauseItIsWayTooLongToFitTheLimitOfEightyCharacters.wav",
      }),
      createFileEntry({ path: "Valid_Name-OK!.aif" }),
    ];
    const registry = new Registry("root");
    loadRegistry(registry, entries);
    registry.applyTransform(SP404Mk2NameTransformer);
    expect(registry.toString()).toBe(
      [
        "root",
        "├── NameWithAccents.wav",
        "├── Invalid_Char_.mp3",
        "├── ThisIsAVeryLongNameThatShouldBeTruncatedBecauseItIsWayTooLongToFitTheLimitOf.wav",
        "└── Valid_Name_OK!.aif",
        "",
      ].join("\n"),
    );
  });

  it("applies SkipJunkTransformer to mark __MACOSX and hidden entries as skipped", () => {
    const entries = [
      createFileEntry({ path: "__MACOSX/file1.wav" }),
      createFileEntry({ path: ".DS_Store" }),
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "sub1/.hidden" }),
    ];
    const registry = new Registry("root");
    loadRegistry(registry, entries);
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
});
