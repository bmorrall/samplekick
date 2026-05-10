import { describe, expect, it } from "vitest";
import { createKnownFileTypeTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createKnownFileTypeTransformer", () => {
  describe("when the name ends with .fxp", () => {
    it("sets sampleType to Serum Presets", () => {
      const entry = createTransformEntry({ name: "patch.fxp" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Serum Presets");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Serum Presets when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "patch.FXP" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Serum Presets");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntry({ name: "patch.fxp", sampleType: "custom" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the name ends with .phaseplant", () => {
    it("sets sampleType to Phase Plant Presets", () => {
      const entry = createTransformEntry({ name: "patch.phaseplant" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Phase Plant Presets");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Phase Plant Presets when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "patch.PHASEPLANT" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Phase Plant Presets");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntry({ name: "patch.phaseplant", sampleType: "custom" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("sets sampleType when extension is on the path", () => {
      const entry = createTransformEntry({ name: "patch", path: "presets/patch.phaseplant" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Phase Plant Presets");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });
  });

  describe("when the file is not a known preset type", () => {
    it("does not set sampleType for .wav files", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType for .mid files (handled by MidiFileTransformer)", () => {
      const entry = createTransformEntry({ name: "song.mid" });
      createKnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
