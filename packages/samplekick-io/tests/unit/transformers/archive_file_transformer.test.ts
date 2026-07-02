import { describe, expect, it } from "vitest";
import { createArchiveFileTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createArchiveFileTransformer", () => {
  describe("when the path ends with .zip", () => {
    it("sets sampleType to Archive", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.zip", path: "extras/pack.zip" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Archive when extension is uppercase", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.ZIP", path: "extras/pack.ZIP" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType but still sets keepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.zip", path: "extras/pack.zip", sampleType: "custom" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the path contains 'Ableton'", () => {
    it("sets sampleType to Ableton Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Ableton" }],
        { name: "My Set.zip", path: "Ableton/My Set.zip" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ableton Projects");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the path contains 'FL Studio'", () => {
    it("sets sampleType to FL Studio Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "FL Studio" }],
        { name: "My Song.zip", path: "FL Studio/My Song.zip" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("FL Studio Projects");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the path contains 'Serum'", () => {
    it("sets sampleType to Serum Presets", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Serum" }],
        { name: "patches.zip", path: "Serum/patches.zip" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Serum Presets");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the path contains 'Phase Plant'", () => {
    it("sets sampleType to Phase Plant Presets", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Phase Plant" }],
        { name: "presets.zip", path: "Phase Plant/presets.zip" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Phase Plant Presets");
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  describe("when the path contains multiple recognised keywords", () => {
    it("falls back to Archive", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Ableton FL Studio" }],
        { name: "pack.zip", path: "Ableton FL Studio/pack.zip" },
        [],
      );
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
    });
  });

  describe("when the path does not end with .zip", () => {
    it("does not set sampleType", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });
  });

  describe("when the entry is the root node", () => {
    it("does not set sampleType even if the path ends with .zip", () => {
      // Root node has no parent - it is the archive being processed, not an embedded one
      const entry = createTransformEntry({
        name: "pack.zip",
        path: "pack.zip",
      });
      const transformer = createArchiveFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });
  });

  describe("when tagSampleType is false", () => {
    it("sets keepStructure but not sampleType for .zip files", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.zip", path: "extras/pack.zip" },
        [],
      );
      const transformer = createArchiveFileTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).toHaveBeenCalledWith(true);
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure for non-.zip files", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      const transformer = createArchiveFileTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure for the root node", () => {
      const entry = createTransformEntry({
        name: "pack.zip",
        path: "pack.zip",
      });
      const transformer = createArchiveFileTransformer({
        tagSampleType: false,
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
