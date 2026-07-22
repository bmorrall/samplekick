import { describe, expect, it } from "vitest";
import { createDirectorySubcategoryTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createDirectorySubcategoryTransformer", () => {
  describe("when a directory has no known sampleType but its parent does", () => {
    it('enables "808s" under a "Drums" parent as a kept subcategory folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "808s", isFile: false },
        [{ name: "808.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it('enables "808s" under a "Drum Loops" parent as a kept subcategory folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "808s", isFile: false },
        [{ name: "808.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it('enables "909s" under a "Drums" parent as a kept subcategory folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "909s", isFile: false },
        [{ name: "909.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it('enables "909s" under a "Drum Loops" parent as a kept subcategory folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "909s", isFile: false },
        [{ name: "909.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it('enables "Latin" under "Drum Loops" as a kept subcategory folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it('enables "Speed House" under "Melodies" as a kept subcategory folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House", isFile: false },
        [{ name: "melody.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).not.toHaveBeenCalled();
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("still enables a directory whose name has a '& MIDI' suffix and renames it to the stripped display name", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House & MIDI", isFile: false },
        [{ name: "melody.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).toHaveBeenCalledWith("Speed House");
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("still enables a directory whose name has a '& Stems' suffix and renames it to the stripped display name", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin & Stems", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setEnabled).toHaveBeenCalledWith(true);
      expect(entry.setName).toHaveBeenCalledWith("Latin");
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when the directory already has a sampleType", () => {
    it("does not enable or overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin", isFile: false, sampleType: "Custom" },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
    });
  });

  describe("when the directory should not be treated as a subcategory", () => {
    it("does not enable the directory when the parent has no sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Unknown" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not enable the directory when the child name ends with 'Stems'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Loop Stems", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not enable the directory when the child name ends with 'Steps'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Loop Steps", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not enable the directory when the child name is 'MIDI'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "MIDI", isFile: false },
        [{ name: "track.mid" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not enable the directory when the child name ends with 'MIDI' (e.g. 'Drum MIDI')", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Drum MIDI", isFile: false },
        [{ name: "track.mid" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not enable the directory when the child name already contains ' - '", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Drum Loops - Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not enable the directory when the parent sampleType is not a known folder name", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Custom Pack", sampleType: "My Custom Type" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
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

    it("does not enable the directory when the child name ends with 'Kits'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Loops", sampleType: "Loops" }],
        { name: "Melody Kits", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not enable the directory when the child name ends with 'Kit'", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Loops", sampleType: "Loops" }],
        { name: "Melody Kit", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySubcategoryTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setEnabled).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });
  });
});
