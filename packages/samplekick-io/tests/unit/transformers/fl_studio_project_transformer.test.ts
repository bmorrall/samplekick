import { describe, expect, it } from "vitest";
import { createFLStudioProjectTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createFLStudioProjectTransformer", () => {
  describe("when a directory has a .flp child", () => {
    it("sets sampleType to FL Studio Projects", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Beat", isFile: false },
        [{ name: "My Beat.flp" }],
      );
      const transformer = createFLStudioProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("FL Studio Projects");
    });

    it("sets keepStructure to true", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Beat", isFile: false },
        [{ name: "My Beat.flp" }],
      );
      const transformer = createFLStudioProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("matches .FLP extension case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Beat", isFile: false },
        [{ name: "My Beat.FLP" }],
      );
      const transformer = createFLStudioProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("FL Studio Projects");
    });
  });

  describe("when the .flp child is missing", () => {
    it("does not set sampleType or keepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "My Beat", isFile: false },
        [{ name: "readme.txt" }],
      );
      const transformer = createFLStudioProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the entry has no children", () => {
    it("does not set sampleType or keepStructure", () => {
      const entry = createTransformEntry({ name: "My Beat.flp" });
      const transformer = createFLStudioProjectTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
