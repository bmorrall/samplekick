import { describe, expect, it } from "vitest";
import { DirectorySampleTypeTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DirectorySampleTypeTransformer", () => {
  describe('when the directory is named "808s"', () => {
    it('sets sampleType to "808s"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "808s", isFile: false },
        [{ name: "808.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("808s");
    });

    it('sets sampleType to "808s" for the singular form "808"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "808", isFile: false },
        [{ name: "808.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("808s");
    });

    it('sets sampleType to "Drums - 808s" when under a "Drums" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "808s", isFile: false },
        [{ name: "808.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums - 808s");
    });

    it('sets sampleType to "Drum Loops - 808s" when under a "Drum Loops" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "808s", isFile: false },
        [{ name: "808.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - 808s");
    });
  });

  describe('when the directory is named "909s"', () => {
    it('sets sampleType to "909s"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "909s", isFile: false },
        [{ name: "909.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("909s");
    });

    it('sets sampleType to "909s" for the singular form "909"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "909", isFile: false },
        [{ name: "909.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("909s");
    });

    it('sets sampleType to "Drums - 909s" when under a "Drums" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "909s", isFile: false },
        [{ name: "909.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums - 909s");
    });

    it('sets sampleType to "Drum Loops - 909s" when under a "Drum Loops" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "909s", isFile: false },
        [{ name: "909.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - 909s");
    });
  });

  describe("when the directory is a direct child of a known-type parent", () => {
    it('sets sampleType to "Drum Loops - Latin" for "Latin" under a "Drum Loops" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - Latin");
    });

    it('sets sampleType to "Melodies - Speed House" for "Speed House" under a "Melodies" parent', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodies - Speed House");
    });

    it("does not set sampleType when the parent sampleType is already a subcategory", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Speed House", sampleType: "Melodies - Speed House" }],
        { name: "Loop Stems & MIDI", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the parent has a custom user-defined sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "My Custom Folder", sampleType: "Custom Type" }],
        { name: "Subgenre", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the parent has a compound sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Bass and Drums", sampleType: "Bass and Drums" }],
        { name: "Subgenre", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the folder name contains a dash separator", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Atoms Drum Loop - 154 BPM", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it('resolves a compound name before falling through to the subcategory check', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Bass and Drums", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass and Drums");
    });
  });

  describe("when the directory name has an ignored suffix (& MIDI, & Stems)", () => {
    it('treats "Drum Loops & MIDI" as "Drum Loops" for sampleType matching', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops & MIDI", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('treats "Drum Loops and MIDI" as "Drum Loops" for sampleType matching', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops and MIDI", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('strips MIDI suffix from subcategory label', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House & MIDI", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodies - Speed House");
    });

    it('treats "Drum Loops & Stems" as "Drum Loops" for sampleType matching', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops & Stems", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('strips Stems suffix from subcategory label', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House & Stems", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodies - Speed House");
    });
  });

  describe("when the directory name is a compound of two known types", () => {
    it('sets sampleType to "Bass and Drums" for "Bass and Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bass and Drums", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass and Drums");
    });

    it('sets sampleType to "Bass and Drums" for "Bass & Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bass & Drums", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass and Drums");
    });

    it("does not set sampleType when one part is unrecognised", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bass and Bonks", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when the directory name is a dash-separated type and subcategory", () => {
    it('sets sampleType to "Drums - 808s" for the standalone folder "Drums - 808s"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums - 808s", isFile: false },
        [{ name: "808.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums - 808s");
    });

    it('sets sampleType to "Drum Loops - Latin" for the standalone folder "Drum Loops - Latin"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops - Latin", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops - Latin");
    });

    it("matches case-insensitively on the prefix", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drums - 808s", isFile: false },
        [{ name: "808.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums - 808s");
    });

    it("does not set sampleType when the prefix is unrecognised", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonks - 808s", isFile: false },
        [{ name: "808.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe('when the directory name ends with "Stems"', () => {
    it("does not set sampleType for standalone Stems when under a known-type parent", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Stems", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType for a suffixed name like 'Latin Stems' when under a known-type parent", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drum Loops", sampleType: "Drum Loops" }],
        { name: "Latin Stems", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType for a suffixed name like 'Speed House Stems' when under a known-type parent", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodies", sampleType: "Melodies" }],
        { name: "Speed House Stems", isFile: false },
        [{ name: "bass.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe('when the directory name ends with "Steps"', () => {
    it("does not set sampleType for a name like 'Loop Steps' when under a known-type parent", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "Loop Steps", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
