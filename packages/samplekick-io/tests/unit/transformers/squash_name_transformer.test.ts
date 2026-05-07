import { describe, expect, it } from "vitest";
import { SquashNameTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("SquashNameTransformer", () => {
  it("squashes a space-separated name to camelCase", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("BassLoops");
  });

  it("squashes a hyphen-separated name to camelCase", () => {
    const entry = createTransformEntry({ name: "Bass-Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("BassLoops");
  });

  it("squashes an underscore-separated name to camelCase", () => {
    const entry = createTransformEntry({ name: "Bass_Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("BassLoops");
  });

  it("squashes mixed separators to camelCase", () => {
    const entry = createTransformEntry({ name: "Ghosthack - Bass Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("GhosthackBassLoops");
  });

  it("preserves the case of the first word", () => {
    const entry = createTransformEntry({ name: "kick drum.wav" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kickDrum.wav");
  });

  it("preserves existing capitalisation within words", () => {
    const entry = createTransformEntry({ name: "SP404 Mk2" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("SP404Mk2");
  });

  it("squashes packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "My Pack" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("MyPack");
  });

  it("squashes sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Bass Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("BassLoops");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "Bass Loops" });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "Bass Loops", packageName: "My Pack", sampleType: "Drum Hits", keepStructure: true });
    SquashNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
