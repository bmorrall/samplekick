import { describe, expect, it } from "vitest";
import { createKeepParentsTransformer } from "../../../src";
import {
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

const transformer = createKeepParentsTransformer();

describe("createKeepParentsTransformer", () => {
  describe("when a directory has file children", () => {
    it("sets keepStructure to true", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Pack.zip" }],
        { name: "Kicks", isFile: false },
        [{ name: "kick.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("sets keepStructure to true for a nested directory with file children", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "One Shots", isFile: false },
        [{ name: "snare.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });
  });

  describe("when a directory has no file children", () => {
    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Empty Folder", isFile: false },
        [],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the entry is a file", () => {
    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "kick.wav", isFile: true },
        [],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the entry is the root node (no parent)", () => {
    it("does not call setKeepStructure even when it has file children", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Pack.zip", isFile: false },
        [{ name: "kick.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
