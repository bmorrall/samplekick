import { describe, expect, it } from "vitest";
import { DirectorySampleTypeTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DirectorySampleTypeTransformer", () => {
  describe("when the entry has no children", () => {
    it("does not set sampleType", () => {
      const entry = createTransformEntry({ name: "Drums" });
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe('when the directory is named "Loops" and an ancestor is a known sample type', () => {
    it('sets sampleType to "Drum Loops" for "Loops" inside a "Drums" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Clap Loops" for "Loops" inside a "Claps" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Claps" }],
        { name: "Loops", isFile: false },
        [{ name: "clap.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Clap Loops");
    });

    it('sets sampleType to "Drum Loops" for "Loops" nested inside "Root/Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [
          { name: "Root" },
          { name: "Drums" },
        ],
        { name: "Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it("matches the ancestor name case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "drums" }],
        { name: "Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Loops" when no ancestor is a known sample type', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Bonks" }],
        { name: "Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Loops");
    });

    it('sets sampleType to "Loops" when there is no ancestor at all', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Loops");
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "Loops", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe('when the directory is named "One Shots" and an ancestor is a known sample type', () => {
    it('sets sampleType to "Drum One Shots" for "One Shots" inside a "Drums" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Clap One Shots" for "One-Shots" inside a "Claps" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Claps" }],
        { name: "One-Shots", isFile: false },
        [{ name: "clap.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Clap One Shots");
    });

    it('sets sampleType to "Kick One Shots" for "OneShots" inside a "Kicks" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Kicks" }],
        { name: "OneShots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Kick One Shots");
    });

    it('sets sampleType to "One Shots" when no ancestor is a known sample type', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Bonks" }],
        { name: "One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("One Shots");
    });

    it('sets sampleType to "One Shots" when there is no ancestor at all', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("One Shots");
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums" }],
        { name: "One Shots", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe('when the parent directory is named "Loops"', () => {
    it('sets sampleType to "Drum Loops" for "Drums" inside a "Loops" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Loops" }],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Drum Loops" for singular "Drum" inside a "Loops" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Loops" }],
        { name: "Drum", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it("matches the parent name case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "loops" }],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Melody Loops" for "Melodies" inside a "Loops" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Loops" }],
        { name: "Melodies", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody Loops");
    });
  });

  describe('when the parent directory is named "One Shots" or "One-Shots"', () => {
    it('sets sampleType to "Drum One Shots" for "Drums" inside a "One Shots" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "One Shots" }],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for singular "Drum" inside a "One Shots" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "One Shots" }],
        { name: "Drum", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for "Drums" inside a "One-Shots" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "One-Shots" }],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for "Drums" inside a "OneShots" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "OneShots" }],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it("matches the parent name case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "one shots" }],
        { name: "Drums", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Melody One Shots" for "Melodies" inside a "One Shots" folder', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "One Shots" }],
        { name: "Melodies", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody One Shots");
    });
  });

  describe('when a "Loops" or "One Shots" folder is a more distant ancestor', () => {
    it('sets sampleType to "Clap Loops" for "Claps" nested inside "Loops/Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [
          { name: "Loops" },
          { name: "Drums" },
        ],
        { name: "Claps", isFile: false },
        [{ name: "clap.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Clap Loops");
    });

    it('sets sampleType to "Snare Loops" for "Snares" nested inside "Loops/Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [
          { name: "Loops" },
          { name: "Drums" },
        ],
        { name: "Snares", isFile: false },
        [{ name: "snare.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Snare Loops");
    });

    it('sets sampleType to "Clap One Shots" for "Claps" nested inside "One Shots/Drums"', () => {
      const entry = createTransformEntryInHierarchy(
        [
          { name: "One Shots" },
          { name: "Drums" },
        ],
        { name: "Claps", isFile: false },
        [{ name: "clap.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Clap One Shots");
    });
  });
});
