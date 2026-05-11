import { describe, expect, it } from "vitest";
import { createDrumSubcategoryTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createDrumSubcategoryTransformer", () => {
  describe('when the directory is named "Drum Fills"', () => {
    it('sets sampleType to "Drum Fills"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it('sets sampleType to "Drum Fills" for the singular form "Drum Fill"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Fill", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it('sets sampleType to "Drum Fills" for the plural prefix "Drums Fills"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it('sets sampleType to "Drum Fills" for the dash-separated form "Drum - Fills"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum - Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it('sets sampleType to "Drum Fills" for the dash-separated form "Drums - Fills"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums - Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drum fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Fills", isFile: false, sampleType: "Custom" },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe('when the directory is named "Fills" under a Drums parent', () => {
    it('sets sampleType to "Drum Fills"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it('sets sampleType to "Drum Fills" for the singular form "Fill"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "Fill", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it('matches with the singular parent name "Drum"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum" }],
        { name: "Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "drums" }],
        { name: "fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Fills");
    });

    it('does not set sampleType when the parent is not drums', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Percussion" }],
        { name: "Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe('when the directory is named "Drum Breaks"', () => {
    it('sets sampleType to "Drum Breaks"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Breaks", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });

    it('sets sampleType to "Drum Breaks" for the singular form "Drum Break"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Break", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });

    it('sets sampleType to "Drum Breaks" for the dash-separated form "Drum - Breaks"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum - Breaks", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });

    it('sets sampleType to "Drum Breaks" for the dash-separated form "Drums - Breaks"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums - Breaks", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "DRUM BREAKS", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });

    it('sets sampleType to "Drum Breaks" for a brand-prefixed form "Cymatics - SESSIONS - Drum Breaks"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymatics - SESSIONS - Drum Breaks", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });

    it('sets sampleType to "Drum Breaks" for a noise-suffixed form "Drum Break Collection"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Break Collection", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });
  });

  describe('when the directory is named "Breaks" under a Drums parent', () => {
    it('sets sampleType to "Drum Breaks"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "Breaks", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });

    it('sets sampleType to "Drum Breaks" for the singular form "Break"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "Break", isFile: false },
        [{ name: "break.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Breaks");
    });
  });

  describe("when the directory name does not match any drum subcategory", () => {
    it("does not set sampleType for an unrecognised folder name", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Fills", isFile: false },
        [{ name: "fill.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType for a bare 'Drums' folder", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDrumSubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });
});
