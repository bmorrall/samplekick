import { describe, expect, it } from "vitest";
import { createDirectorySubcategoryTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createDirectorySubcategoryTransformer", () => {
  describe("when a directory has no known sampleType but its parent does", () => {
    it('sets sampleType to "Drums - 808s" for "808s" under a "Drums" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "808s", isFile: false },
        [{ name: "808.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums - 808s");
    });

    it('sets sampleType to "Drum Loops - 808s" for "808s" under a "Drum Loops" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "808s", isFile: false },
        [{ name: "808.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - 808s");
    });

    it('sets sampleType to "Drums - 909s" for "909s" under a "Drums" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "909s", isFile: false },
        [{ name: "909.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums - 909s");
    });

    it('sets sampleType to "Drum Loops - 909s" for "909s" under a "Drum Loops" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "909s", isFile: false },
        [{ name: "909.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - 909s");
    });

    it('sets sampleType to "Drum Loops - Latin" for "Latin" under "Drum Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - Latin");
    });

    it('sets sampleType to "Melodies - Speed House" for "Speed House" under "Melodies"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House", isFile: false },
        [{ name: "melody.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith(
        "Melodies - Speed House",
      );
    });

    it("strips & MIDI suffix from the child display name", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House & MIDI", isFile: false },
        [{ name: "melody.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith(
        "Melodies - Speed House",
      );
    });

    it("strips & Stems suffix from the child display name", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin & Stems", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - Latin");
    });
  });

  describe("when the directory already has a sampleType", () => {
    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin", isFile: false, sampleType: "Custom" },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when the directory should not be treated as a subcategory", () => {
    it("does not set sampleType when the parent has no sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Unknown" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the child name ends with 'Stems'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Loop Stems", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the child name ends with 'Steps'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Loop Steps", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the child name is 'MIDI'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "MIDI", isFile: false },
        [{ name: "track.mid" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the child name ends with 'MIDI' (e.g. 'Drum MIDI')", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Drum MIDI", isFile: false },
        [{ name: "track.mid" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the child name is 'MIDI'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "MIDI", isFile: false },
        [{ name: "track.mid" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the child name already contains ' - '", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Drum Loops - Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the parent sampleType is not a known folder name", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Custom Pack", sampleType: "My Custom Type" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe('when a directory has sampleType set to a "Prefix One Shots" form', () => {
    it('normalises "Melody One Shots" to "Melodies"', () => {
      const entry = createTransformEntry({
        name: "Melody One Shots",
        sampleType: "Melody One Shots",
        isFile: false,
      });
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodies");
    });

    it('normalises "Drum One Shots" to "Drums"', () => {
      const entry = createTransformEntry({
        name: "Drum One Shots",
        sampleType: "Drum One Shots",
        isFile: false,
      });
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it("does not call setSampleType when sampleType is already a standalone", () => {
      const entry = createTransformEntry({
        name: "Melodies",
        sampleType: "Melodies",
        isFile: false,
      });
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setSampleType when entry has no own sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Unknown" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
