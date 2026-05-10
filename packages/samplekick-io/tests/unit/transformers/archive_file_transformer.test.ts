import { describe, expect, it } from "vitest";
import { createArchiveFileTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createArchiveFileTransformer", () => {
  describe("when the name ends with .zip", () => {
    it("sets sampleType to Archive", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.zip" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to Archive when extension is uppercase", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.ZIP" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack.zip", sampleType: "custom" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the path ends with .zip", () => {
    it("sets sampleType to Archive when name does not include extension", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "extras" }],
        { name: "pack", path: "extras/pack.zip" },
        [],
      );
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Archive");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });
  });

  describe("when the name does not end with .zip", () => {
    it("does not set sampleType", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the entry is the root node", () => {
    it("does not set sampleType even if the name ends with .zip", () => {
      // Root node has no parent - it is the archive being processed, not an embedded one
      const entry = createTransformEntry({ name: "pack.zip" });
      createArchiveFileTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
