import { describe, expect, it } from "vitest";
import { createDirectorySampleTypeTransformer } from "../../../src";
import {
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createDirectorySampleTypeTransformer", () => {
  describe('when the directory is named "Drums"', () => {
    it('sets sampleType to "Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it('sets sampleType to "Drums" for the singular form "Drum"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setReadOnly).not.toHaveBeenCalled();
    });
  });

  describe('when the directory is named "Percussion"', () => {
    it('sets sampleType to "Percussion"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Percussion", isFile: false },
        [{ name: "shaker.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Percussion");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "PERCUSSION", isFile: false },
        [{ name: "shaker.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Percussion");
    });

    it('sets sampleType to "Percussion" for "Perc"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Perc", isFile: false },
        [{ name: "shaker.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Percussion");
    });

    it('sets sampleType to "Percussion" for "Percs"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Percs", isFile: false },
        [{ name: "shaker.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Percussion");
    });
  });

  describe('when the directory is named "Cymbals"', () => {
    it('sets sampleType to "Cymbals"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymbals", isFile: false },
        [{ name: "cymbal.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Cymbals");
    });

    it('sets sampleType to "Cymbals" for the singular form "Cymbal"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymbal", isFile: false },
        [{ name: "cymbal.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Cymbals");
    });
  });

  describe('when the directory is named "Claps"', () => {
    it('sets sampleType to "Claps"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Claps", isFile: false },
        [{ name: "clap.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Claps");
    });

    it('sets sampleType to "Claps" for the singular form "Clap"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Clap", isFile: false },
        [{ name: "clap.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Claps");
    });
  });

  describe('when the directory is named "Snares"', () => {
    it('sets sampleType to "Snares"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Snares", isFile: false },
        [{ name: "snare.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Snares");
    });

    it('sets sampleType to "Snares" for the singular form "Snare"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Snare", isFile: false },
        [{ name: "snare.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Snares");
    });
  });

  describe('when the directory is named "Hihats"', () => {
    it('sets sampleType to "Hihats" for "Hihats"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hihats", isFile: false },
        [{ name: "hat.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it('sets sampleType to "Hihats" for "Hats"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hats", isFile: false },
        [{ name: "hat.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it('sets sampleType to "Hihats" for "Hi Hats"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hi Hats", isFile: false },
        [{ name: "hat.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it('sets sampleType to "Hihats" for "Hi-Hats"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hi-Hats", isFile: false },
        [{ name: "hat.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "hihats", isFile: false },
        [{ name: "hat.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });
  });

  describe('when the directory is named "Kicks"', () => {
    it('sets sampleType to "Kicks"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Kicks", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Kicks");
    });

    it('sets sampleType to "Kicks" for the singular form "Kick"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Kick", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Kicks");
    });
  });

  describe('when the directory is named "Rimshots"', () => {
    it('sets sampleType to "Rimshots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Rimshots", isFile: false },
        [{ name: "rimshot.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rimshots");
    });

    it('sets sampleType to "Rimshots" for the singular form "Rimshot"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Rimshot", isFile: false },
        [{ name: "rimshot.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rimshots");
    });
  });

  describe('when the directory is named "Rides"', () => {
    it('sets sampleType to "Rides"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Rides", isFile: false },
        [{ name: "ride.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rides");
    });

    it('sets sampleType to "Rides" for the singular form "Ride"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Ride", isFile: false },
        [{ name: "ride.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rides");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "rides", isFile: false },
        [{ name: "ride.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rides");
    });
  });

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
