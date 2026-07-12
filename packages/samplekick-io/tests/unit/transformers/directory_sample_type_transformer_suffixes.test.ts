import { describe, expect, it } from "vitest";
import { createDirectorySampleTypeTransformer } from "../../../src";
import {
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createDirectorySampleTypeTransformer", () => {
  describe('when the directory is named "Drum and Bass"', () => {
    it('sets sampleType to "Drum and Bass"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum and Bass", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum and Bass");
    });

    it('sets sampleType to "Drum and Bass" for the "Drum n Bass" form', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum n Bass", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum and Bass");
    });

    it('sets sampleType to "Drum and Bass" for the "DnB" abbreviation', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "DnB", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum and Bass");
    });

    it('sets sampleType to "Drum and Bass" for the "D&B" abbreviation', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "D&B", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum and Bass");
    });

    it('sets sampleType to "Drum and Bass" for the "Drum & Bass" form', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum & Bass", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum and Bass");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drum and bass", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum and Bass");
    });
  });

  describe('when the directory name has a "Shots" suffix', () => {
    it('sets sampleType to "Synths" for "Synth Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Synth Shots", isFile: false },
        [{ name: "synth.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Synths");
    });

    it('sets sampleType to "Bass" for "Bass Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bass Shots", isFile: false },
        [{ name: "bass.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass");
    });

    it('sets sampleType to "Vocals" for "Vocal Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Vocal Shots", isFile: false },
        [{ name: "vox.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "SYNTH SHOTS", isFile: false },
        [{ name: "synth.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Synths");
    });

    it('sets sampleType to "Synths" for "Synth Shots" under "One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "One Shots" }],
        { name: "Synth Shots", isFile: false },
        [{ name: "synth.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Synths");
    });
  });

  describe("when the directory name does not match any known sampleType", () => {
    it("does not set sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonks", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the parent is also unrecognised", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Latin" }],
        { name: "Latin Stems & MIDI", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });
  });

  describe("when the directory name has a noise suffix", () => {
    it('sets sampleType to "Loops" for "Loop Stems & MIDI"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Loop Stems & MIDI", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Loops");
    });

    it('sets sampleType to "Drum Loops" for "Drum Loops Collection"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops Collection", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Hihats" for "Hihat Bundle"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hihat Bundle", isFile: false },
        [{ name: "hihat.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it('sets sampleType to "Vocals" for "Vocals Library"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Vocals Library", isFile: false },
        [{ name: "vox.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals");
    });

    it("matches noise suffix case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops COLLECTION", isFile: false },
        [{ name: "loop.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });
  });
});
