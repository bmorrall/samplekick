import { describe, expect, it } from "vitest";
import { createArchiveFileTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createArchiveFileTransformer", () => {
  describe("when the path ends with .zip", () => {
    it("sets sampleType to Archive", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.zip", path: "extras/pack.zip" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Archive when extension is uppercase", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.ZIP", path: "extras/pack.ZIP" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.zip", path: "extras/pack.zip", sampleType: "custom" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the path contains 'Ableton'", () => {
    it("sets sampleType to Ableton Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Ableton" }],
        { name: "My Set.zip", path: "Ableton/My Set.zip" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ableton Projects");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });
  });

  describe("when the path contains 'FL Studio'", () => {
    it("sets sampleType to FL Studio Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "FL Studio" }],
        { name: "My Song.zip", path: "FL Studio/My Song.zip" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("FL Studio Projects");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });
  });

  describe("when the path contains multiple recognised keywords", () => {
    it("falls back to Archive", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Ableton FL Studio" }],
        { name: "pack.zip", path: "Ableton FL Studio/pack.zip" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
    });
  });

  describe("when the path does not end with .zip", () => {
    it("does not set sampleType", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the entry is the root node", () => {
    it("does not set sampleType even if the path ends with .zip", () => {
      // Root node has no parent - it is the archive being processed, not an embedded one
      const entry = createTransformEntry({ name: "pack.zip", path: "pack.zip" });
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
