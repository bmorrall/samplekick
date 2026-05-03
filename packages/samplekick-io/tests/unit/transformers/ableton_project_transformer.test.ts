import { describe, expect, it } from "vitest";
import { AbletonProjectTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("AbletonProjectTransformer", () => {
  describe("when a directory has a .als child", () => {
    it("sets sampleType to Ableton Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "My Project.als" }],
      );
      AbletonProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ableton Projects");
    });

    it("sets keepStructure to true", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "My Project.als" }],
      );
      AbletonProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("matches .ALS extension case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "My Project.ALS" }],
      );
      AbletonProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ableton Projects");
    });
  });

  describe("when the .als child is missing", () => {
    it("does not set sampleType or keepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "readme.txt" }],
      );
      AbletonProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the entry has no children", () => {
    it("does not set sampleType or keepStructure", () => {
      const entry = createTransformEntry({ name: "My Project.als" });
      AbletonProjectTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
