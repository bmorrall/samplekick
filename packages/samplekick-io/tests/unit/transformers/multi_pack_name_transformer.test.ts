import { describe, expect, it } from "vitest";
import { createMultiPackNameTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

const transformer = createMultiPackNameTransformer();

describe("createMultiPackNameTransformer", () => {
  it("sets packageName on a directory whose name contains ' - ' and whose parent name does not", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Acapellas and Vocals" }],
      { name: "Ghosthack - UPB2022 Vocal Freebie", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith(
      "Ghosthack - UPB2022 Vocal Freebie",
    );
  });

  it("sets packageName on a root directory (no parent) whose name contains ' - '", () => {
    const entry = createTransformEntryInHierarchy(
      [],
      { name: "Ghosthack - Ultimate Freebie Collection", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith(
      "Ghosthack - Ultimate Freebie Collection",
    );
  });

  it("tags when parent has ' - ' but name contains 'Kit'", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Ghosthack - Advent Calendar 2019 - Day 12 - Trap Kits" }],
      { name: "Holiday Kit 05 - 116bpm - D#maj", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith(
      "Holiday Kit 05 - 116bpm - D#maj",
    );
  });

  it("does not tag when parent has ' - ' and name does not contain 'Kit'", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Cymatics - Mystery Pack Vol 4 - Loop Stems and MIDI Pt 2" }],
      { name: "Stems and MIDI - Trap", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not tag a directory whose name has no ' - '", () => {
    const entry = createTransformEntryInHierarchy(
      [],
      { name: "Acapellas and Vocals", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not overwrite an existing packageName", () => {
    const entry = createTransformEntryInHierarchy(
      [],
      {
        name: "Ghosthack - Ultimate Freebie Collection",
        isFile: false,
        packageName: "Already Set",
      },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not tag file nodes (no children)", () => {
    const entry = createTransformEntry({
      name: "Ghosthack - My Sample.wav",
      isFile: true,
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not set sampleType", () => {
    const entry = createTransformEntryInHierarchy(
      [],
      { name: "Ghosthack - Ultimate Freebie Collection", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not set keepStructure", () => {
    const entry = createTransformEntryInHierarchy(
      [],
      { name: "Ghosthack - Ultimate Freebie Collection", isFile: false },
      [{ name: "file.wav" }],
    );
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });
});
