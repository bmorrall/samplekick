import { describe, expect, it } from "vitest";
import { createDirectoryChildNameTransformer } from "../../../src";
import {
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createDirectoryChildNameTransformer", () => {
  describe("when file children share a common known-type segment", () => {
    it('tags the directory as "Foley" when all children share the "Foley" segment', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        {
          name: "Cymatics - Nebula Foley Percussion & Textures",
          isFile: false,
        },
        [
          { name: "Cymatics - Foley - Coin Drop 1.wav" },
          { name: "Cymatics - Foley - Metal Hit.wav" },
        ],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Foley");
    });

    it('tags the directory as "Drums" when children share a "Drums" segment', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Brand - Drum Kit", isFile: false },
        [
          { name: "Brand - Drums - Kick 1.wav" },
          { name: "Brand - Drums - Snare 2.wav" },
        ],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it("tags the directory from a single child file (no intersection needed)", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymatics - Nebula", isFile: false },
        [{ name: "Cymatics - Foley - Coin Drop 3.wav" }],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Foley");
    });
  });

  describe("when the directory already has a sampleType", () => {
    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Folder", isFile: false, sampleType: "Kicks" },
        [{ name: "Brand - Foley - Hit.wav" }],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when the condition is not met", () => {
    it("does not set sampleType when no file children contain ' - '", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Folder", isFile: false },
        [{ name: "kick.wav" }, { name: "snare.wav" }],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when children share no common known-type segment", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Folder", isFile: false },
        [
          { name: "Brand - Foley - Hit.wav" },
          { name: "Brand - Drums - Kick.wav" },
        ],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      // "Brand" is not a known type; "Foley" and "Drums" are not in common.
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when multiple common segments resolve to known types", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Folder", isFile: false },
        [
          { name: "Foley - Drums - Hit.wav" },
          { name: "Foley - Drums - Kick.wav" },
        ],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      // Both "Foley" and "Drums" are common known types — ambiguous, no match.
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType for a leaf node (no children)", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Brand - Foley - Hit.wav", isFile: true },
        [],
      );
      const transformer = createDirectoryChildNameTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
