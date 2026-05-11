import { describe, expect, it } from "vitest";
import { createNormaliseBpmTagTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createNormaliseBpmTagTransformer", () => {
  describe("number before label", () => {
    it("normalises 120BPM to 120bpm", () => {
      const entry = createTransformEntry({ name: "Drums 120BPM.wav" });
      createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Drums 120bpm.wav");
    });

    it("normalises 120 BPM (space separator) to 120bpm", () => {
      const entry = createTransformEntry({ name: "Drums 120 BPM.wav" });
      createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Drums 120bpm.wav");
    });

    it("normalises 120_BPM (underscore separator) to 120bpm", () => {
      const entry = createTransformEntry({ name: "Drums 120_BPM.wav" });
      createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Drums 120bpm.wav");
    });
  });

  describe("label before number", () => {
    it("normalises Bpm120 to 120bpm", () => {
      const entry = createTransformEntry({ name: "Drums Bpm120.wav" });
      createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Drums 120bpm.wav");
    });

    it("normalises BPM 120 (space separator) to 120bpm", () => {
      const entry = createTransformEntry({ name: "Drums BPM 120.wav" });
      createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Drums 120bpm.wav");
    });

    it("normalises BPM_120 (underscore separator) to 120bpm", () => {
      const entry = createTransformEntry({ name: "Drums BPM_120.wav" });
      createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Drums 120bpm.wav");
    });
  });

  it("strips leading zeros from BPM number (080 => 80bpm)", () => {
    const entry = createTransformEntry({ name: "Drums 080BPM.wav" });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Drums 80bpm.wav");
  });

  it("leaves an already canonical 120bpm unchanged", () => {
    const entry = createTransformEntry({ name: "Drums 120bpm.wav" });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Drums 120bpm.wav");
  });

  it("leaves a name with no BPM label unchanged", () => {
    const entry = createTransformEntry({ name: "kick drum.wav" });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick drum.wav");
  });

  it("does not match a single-digit number with a BPM label", () => {
    const entry = createTransformEntry({ name: "Drums 5BPM.wav" });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Drums 5BPM.wav");
  });

  it("does not match a four-digit number with a BPM label", () => {
    const entry = createTransformEntry({ name: "Sample 44100BPM.wav" });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Sample 44100BPM.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "Drums 120 BPM" });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Drums 120bpm");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Loops 120BPM" });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Loops 120bpm");
  });

  it("does not act on a keepStructure entry", () => {
    const entry = createTransformEntry({ name: "Drums 120BPM.wav", keepStructure: true });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on a skipped entry", () => {
    const entry = createTransformEntry({ name: "Drums 120BPM.wav", skipped: true });
    createNormaliseBpmTagTransformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
