import { describe, expect, it } from "vitest";
import { createAbletonProjectTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createAbletonProjectTransformer", () => {
  describe("when a directory has a .als child", () => {
    it("sets sampleType to Ableton Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "My Project.als" }],
      );
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ableton Projects");
    });

    it("sets keepStructure to true", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "My Project.als" }],
      );
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("matches .ALS extension case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "My Project.ALS" }],
      );
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
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
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe('when a directory has an "Ableton Folder Info" child', () => {
    it("sets sampleType to Ableton Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "Ableton Folder Info" }],
      );
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ableton Projects");
    });

    it("sets keepStructure to true", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "Ableton Folder Info" }],
      );
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it('does not match a differently-cased "ableton folder info"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Project", isFile: false },
        [{ name: "ableton folder info" }],
      );
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when the entry has no children", () => {
    it("does not set sampleType or keepStructure", () => {
      const entry = createTransformEntry({ name: "My Project.als" });
      const transformer = createAbletonProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
