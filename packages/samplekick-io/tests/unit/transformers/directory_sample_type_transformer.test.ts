import { describe, expect, it } from "vitest";
import { DirectorySampleTypeTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DirectorySampleTypeTransformer", () => {
  describe('when the directory is named "Drums"', () => {
    it('sets sampleType to "Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it('sets sampleType to "Drums" for the singular form "Drum"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe('when the directory is named "Percussion"', () => {
    it('sets sampleType to "Percussion"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Percussion", isFile: false },
        [{ name: "shaker.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Percussion");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "PERCUSSION", isFile: false },
        [{ name: "shaker.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Percussion");
    });

    it('sets sampleType to "Percussion" for "Perc"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Perc", isFile: false },
        [{ name: "shaker.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Percussion");
    });

    it('sets sampleType to "Percussion" for "Percs"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Percs", isFile: false },
        [{ name: "shaker.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
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
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Cymbals");
    });

    it('sets sampleType to "Cymbals" for the singular form "Cymbal"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymbal", isFile: false },
        [{ name: "cymbal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
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
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Claps");
    });

    it('sets sampleType to "Claps" for the singular form "Clap"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Clap", isFile: false },
        [{ name: "clap.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
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
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Snares");
    });

    it('sets sampleType to "Snares" for the singular form "Snare"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Snare", isFile: false },
        [{ name: "snare.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
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
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it('sets sampleType to "Hihats" for "Hats"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hats", isFile: false },
        [{ name: "hat.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it('sets sampleType to "Hihats" for "Hi Hats"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hi Hats", isFile: false },
        [{ name: "hat.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it('sets sampleType to "Hihats" for "Hi-Hats"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Hi-Hats", isFile: false },
        [{ name: "hat.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Hihats");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "hihats", isFile: false },
        [{ name: "hat.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
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
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Kicks");
    });

    it('sets sampleType to "Kicks" for the singular form "Kick"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Kick", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
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
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rimshots");
    });

    it('sets sampleType to "Rimshots" for the singular form "Rimshot"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Rimshot", isFile: false },
        [{ name: "rimshot.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
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
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rides");
    });

    it('sets sampleType to "Rides" for the singular form "Ride"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Ride", isFile: false },
        [{ name: "ride.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rides");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "rides", isFile: false },
        [{ name: "ride.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Rides");
    });
  });

  describe("when the directory name does not match any known sampleType", () => {
    it("does not set sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonks", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the parent is also unrecognised", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Latin" }],
        { name: "Loop Stems & MIDI", isFile: false },
        [{ name: "loop.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

  });

  describe('when the directory is named "Harp"', () => {
    it('sets sampleType to "Harp"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Harp", isFile: false },
        [{ name: "harp.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Harp");
    });

    it('sets sampleType to "Harp Loops" for "Harp Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Harp Loops", isFile: false },
        [{ name: "harp.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Harp Loops");
    });
  });

  describe('when the directory is named "Pads"', () => {
    it('sets sampleType to "Pads"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Pads", isFile: false },
        [{ name: "pad.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Pads");
    });

    it('sets sampleType to "Pad One Shots" for "Pad One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Pad One Shots", isFile: false },
        [{ name: "pad.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Pad One Shots");
    });
  });

  describe('when the directory is named "E-Piano"', () => {
    it('sets sampleType to "E-Piano"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "E-Piano", isFile: false },
        [{ name: "epiano.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("E-Piano");
    });

    it('sets sampleType to "E-Piano Loops" for "E-Piano Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "E-Piano Loops", isFile: false },
        [{ name: "epiano.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("E-Piano Loops");
    });
  });
});
