import { describe, it, expect } from "vitest";
import {
  SP404Mk2Preset,
  createAbletonProjectTransformer,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("SP-404MKII device preset transforms", () => {
  it("sanitizes entry names when all preset transforms are applied in order", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "NáméWithÁccents.wav" }),
      createFileEntry({ path: "Invalid*Char?.mp3" }),
      createFileEntry({
        path: "ThisIsAVeryLongNameThatShouldBeTruncatedBecauseItIsWayTooLongToFitTheLimitOfEightyCharacters.wav",
      }),
      createFileEntry({ path: "Valid_Name-OK!.aif" }),
    ]);
    for (const transform of SP404Mk2Preset.transforms) {
      registry.applyTransform(transform);
    }
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

  it("does not rename entries inside a keepStructure folder", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "Mÿ Prøject/Mÿ Prøject.als" }),
      createFileEntry({ path: "Mÿ Prøject/Sämples/kick.wav" }),
      createFileEntry({ path: "Drums/snâre.wav" }),
    ]);
    registry.applyTransform(createAbletonProjectTransformer);
    for (const transform of SP404Mk2Preset.transforms) {
      registry.applyTransform(transform);
    }
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

  it("replaces multiple dots with underscores except for the final extension dot", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "kick.01.alt.wav" }),
      createFileEntry({ path: "snare.02.wav" }),
    ]);
    for (const transform of SP404Mk2Preset.transforms) {
      registry.applyTransform(transform);
    }
    expect(registry.toString()).toBe(
      [
        "root",
        "├── kick_01_alt.wav [?] [renamed]",
        "└── snare_02.wav [?] [renamed]",
        "",
      ].join("\n"),
    );
  });

  it("sanitizes packageName and sampleType fields using the same rules as the name", () => {
    const registry = createRegistry("root", [
      createFileEntry({ path: "kick.wav" }),
    ]);
    registry.setPackageName("kick.wav", "Påck Nàme");
    registry.setSampleType("kick.wav", "Drüms & Percüssion");
    for (const transform of SP404Mk2Preset.transforms) {
      registry.applyTransform(transform);
    }
    expect(registry.toString()).toBe(
      [
        "root",
        "└── kick.wav [pkg:Pack Name, type:Drums & Percussion]",
        "",
      ].join("\n"),
    );
  });
});
