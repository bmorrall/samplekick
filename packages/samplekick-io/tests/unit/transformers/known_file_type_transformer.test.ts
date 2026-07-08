import { describe, expect, it } from "vitest";
import { createKnownFileTypeTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createKnownFileTypeTransformer", () => {
  describe("when the name ends with .dnprj", () => {
    it("sets sampleType to Digitone Projects", () => {
      const entry = createTransformEntry({ name: "project.dnprj" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Digitone Projects");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Digitone Projects when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "project.DNPRJ" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Digitone Projects");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType but still sets keepStructure", () => {
      const entry = createTransformEntry({
        name: "project.dnprj",
        sampleType: "custom",
      });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType when extension is on the path", () => {
      const entry = createTransformEntry({
        name: "project",
        path: "projects/project.dnprj",
      });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Digitone Projects");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the name ends with .dnsnd", () => {
    it("sets sampleType to Digitone Sounds", () => {
      const entry = createTransformEntry({ name: "patch.dnsnd" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Digitone Sounds");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Digitone Sounds when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "patch.DNSND" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Digitone Sounds");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType but still sets keepStructure", () => {
      const entry = createTransformEntry({
        name: "patch.dnsnd",
        sampleType: "custom",
      });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType when extension is on the path", () => {
      const entry = createTransformEntry({
        name: "patch",
        path: "sounds/patch.dnsnd",
      });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Digitone Sounds");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the name ends with .fxp", () => {
    it("sets sampleType to Serum Presets", () => {
      const entry = createTransformEntry({ name: "patch.fxp" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Serum Presets");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Serum Presets when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "patch.FXP" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Serum Presets");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType but still sets keepStructure", () => {
      const entry = createTransformEntry({
        name: "patch.fxp",
        sampleType: "custom",
      });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the name ends with .phaseplant", () => {
    it("sets sampleType to Phase Plant Presets", () => {
      const entry = createTransformEntry({ name: "patch.phaseplant" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Phase Plant Presets");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Phase Plant Presets when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "patch.PHASEPLANT" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Phase Plant Presets");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType but still sets keepStructure", () => {
      const entry = createTransformEntry({
        name: "patch.phaseplant",
        sampleType: "custom",
      });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType when extension is on the path", () => {
      const entry = createTransformEntry({
        name: "patch",
        path: "presets/patch.phaseplant",
      });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Phase Plant Presets");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the file is not a known preset type", () => {
    it("does not set sampleType for .wav files", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not set sampleType for .mid files (handled by MidiFileTransformer)", () => {
      const entry = createTransformEntry({ name: "song.mid" });
      const transformer = createKnownFileTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when tagSampleType is false", () => {
    it("sets keepStructure but not sampleType for .dnprj files", () => {
      const entry = createTransformEntry({ name: "project.dnprj" });
      const transformer = createKnownFileTypeTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("sets keepStructure but not sampleType for .dnsnd files", () => {
      const entry = createTransformEntry({ name: "patch.dnsnd" });
      const transformer = createKnownFileTypeTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("sets keepStructure but not sampleType for .fxp files", () => {
      const entry = createTransformEntry({ name: "patch.fxp" });
      const transformer = createKnownFileTypeTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("sets keepStructure but not sampleType for .phaseplant files", () => {
      const entry = createTransformEntry({ name: "patch.phaseplant" });
      const transformer = createKnownFileTypeTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure for non-matching files", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      const transformer = createKnownFileTypeTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
