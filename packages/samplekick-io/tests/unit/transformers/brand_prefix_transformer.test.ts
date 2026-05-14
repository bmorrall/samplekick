import { describe, expect, it } from "vitest";
import { createBrandPrefixTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

const transformer = createBrandPrefixTransformer();

describe("createBrandPrefixTransformer", () => {
  it('prefixes child packageName when parent has "Ghosthack -" packageName', () => {
    const entry = createTransformEntryInHierarchy(
      [
        {
          name: "Ghosthack - Ultimate Freebie",
          packageName: "Ghosthack - Ultimate Freebie",
        },
      ],
      { name: "Construction Kits", isFile: false, packageName: "Day 12 Kits" },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith(
      "Ghosthack - Day 12 Kits",
    );
  });

  it('prefixes child packageName when parent has "Cymatics -" packageName', () => {
    const entry = createTransformEntryInHierarchy(
      [
        {
          name: "Cymatics - Mystery Pack",
          packageName: "Cymatics - Mystery Pack",
        },
      ],
      { name: "Samples", isFile: false, packageName: "Bundle 01" },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Cymatics - Bundle 01");
  });

  it("does not set packageName when child has no own packageName", () => {
    const entry = createTransformEntryInHierarchy(
      [
        {
          name: "Ghosthack - Ultimate Freebie",
          packageName: "Ghosthack - Ultimate Freebie",
        },
      ],
      { name: "Construction Kits", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not set packageName when parent has no brand prefix", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Acapellas and Vocals", packageName: "Acapellas" }],
      {
        name: "Construction Kits",
        isFile: false,
        packageName: "Kit Collection",
      },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not tag file nodes (no children)", () => {
    const entry = createTransformEntry({
      name: "sample.wav",
      isFile: true,
      packageName: "Sample Package",
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not set sampleType", () => {
    const entry = createTransformEntryInHierarchy(
      [
        {
          name: "Ghosthack - Ultimate Freebie",
          packageName: "Ghosthack - Ultimate Freebie",
        },
      ],
      { name: "Construction Kits", isFile: false, packageName: "Day 12 Kits" },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not set packageName when parent has no packageName", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Ghosthack - Ultimate Freebie", packageName: undefined }],
      { name: "Construction Kits", isFile: false, packageName: "Day 12 Kits" },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not prefix when own packageName already starts with the brand name", () => {
    const entry = createTransformEntryInHierarchy(
      [
        {
          name: "Ghosthack - Ultimate Freebie",
          packageName: "Ghosthack - Ultimate Freebie",
        },
      ],
      {
        name: "Ghosthack - Day 12 Kits",
        isFile: false,
        packageName: "Ghosthack - Day 12 Kits",
      },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not prefix when own packageName starts with brand name without hyphen", () => {
    const entry = createTransformEntryInHierarchy(
      [
        {
          name: "Ghosthack - Advent Calendar",
          packageName: "Ghosthack - Advent Calendar",
        },
      ],
      {
        name: "Ghosthack Advent Calendar - Day 15 - Foley",
        isFile: false,
        packageName: "Ghosthack Advent Calendar - Day 15 - Foley",
      },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });
});
