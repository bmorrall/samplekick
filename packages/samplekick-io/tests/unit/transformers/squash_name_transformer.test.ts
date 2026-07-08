import { describe, expect, it } from "vitest";
import { createSquashNameTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createSquashNameTransformer", () => {
  it("squashes a space-separated name to camelCase", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("BassLoops");
  });

  it("squashes a hyphen-separated name to camelCase", () => {
    const entry = createTransformEntry({ name: "Bass-Loops" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("BassLoops");
  });

  it("squashes an underscore-separated name to camelCase", () => {
    const entry = createTransformEntry({ name: "Bass_Loops" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("BassLoops");
  });

  it("squashes mixed separators to camelCase", () => {
    const entry = createTransformEntry({ name: "Ghosthack - Bass Loops" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("GhosthackBassLoops");
  });

  it("preserves the case of the first word", () => {
    const entry = createTransformEntry({ name: "kick drum.wav" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kickDrum.wav");
  });

  it("preserves existing capitalisation within words", () => {
    const entry = createTransformEntry({ name: "SP404 Mk2" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("SP404Mk2");
  });

  it("squashes packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "My Pack",
    });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("MyPack");
  });

  it("squashes sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "Bass Loops",
    });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("BassLoops");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
    expect(entry.setReadOnly).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "Bass Loops",
      packageName: "My Pack",
      sampleType: "Drum Hits",
      readOnly: true,
    });
    const transformer = createSquashNameTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
