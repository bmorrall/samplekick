import { describe, expect, it } from "vitest";
import { createKeepParentsTransformer } from "../../../src";
import type { TransformSource } from "../../../src/types";
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

  describe("when levels=2", () => {
    const transformer2 = createKeepParentsTransformer(2);

    it("also sets keepStructure on the parent of a directory with file children", () => {
      // guitar_stuff has a file child; samples is its parent (with non-root grandparent)
      const samplesEntry = createTransformEntryInHierarchy(
        [{ name: "Guitar Pack" }],
        { name: "samples", isFile: false },
        [{ name: "guitar_stuff" }],
      );
      const guitarStuffEntry = createTransformEntryInHierarchy(
        [{ name: "Guitar Pack" }, { name: "samples" }],
        { name: "guitar_stuff", isFile: false },
        [{ name: "guitar.wav" }],
      );
      const source: TransformSource = {
        eachTransformEntry: (fn) => {
          fn(samplesEntry);
          fn(guitarStuffEntry);
        },
        eachTransformModification: (fn) => {
          fn(samplesEntry);
          fn(guitarStuffEntry);
        },
      };
      transformer2.transform(source);
      expect(guitarStuffEntry.setKeepStructure).toHaveBeenCalledWith(true);
      expect(samplesEntry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("does not set keepStructure on a direct child of root even with levels=2", () => {
      // Kicks is a direct child of root; with levels=2 root must never get keepStructure
      const rootEntry = createTransformEntryInHierarchy(
        [],
        { name: "Pack.zip", isFile: false },
        [{ name: "Kicks" }],
      );
      const kicksEntry = createTransformEntryInHierarchy(
        [{ name: "Pack.zip" }],
        { name: "Kicks", isFile: false },
        [{ name: "kick.wav" }],
      );
      const source: TransformSource = {
        eachTransformEntry: (fn) => {
          fn(rootEntry);
          fn(kicksEntry);
        },
        eachTransformModification: (fn) => {
          fn(rootEntry);
          fn(kicksEntry);
        },
      };
      transformer2.transform(source);
      expect(kicksEntry.setKeepStructure).toHaveBeenCalledWith(true);
      expect(rootEntry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
