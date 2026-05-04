import { describe, expect, it } from "vitest";
import { DirectorySampleTypeTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DirectorySampleTypeTransformer", () => {
  describe('when the directory name contains " and " or " & "', () => {
    it('sets sampleType to "Acapellas and Vocals" for "Acapellas and Vocals"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas and Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Acapellas and Vocals");
    });

    it('sets sampleType to "Acapellas and Vocals" for "Acapellas & Vocals"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas & Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Acapellas and Vocals");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "acapellas and vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Acapellas and Vocals");
    });

    it("does not set sampleType when one part does not match", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas and Bonks", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when neither part matches", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonks and Arps", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas and Vocals", isFile: false, sampleType: "Custom" },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe('when the directory name ends with " Loops"', () => {
    it('sets sampleType to "Drum Loops" for "Drum Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Drum Loops" for the plural form "Drums Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drum loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it("does not set sampleType when the base does not match", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonk Loops", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it('sets sampleType to "Melody Loops" for "Melody Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melody Loops", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody Loops");
    });

    it('sets sampleType to "Sound FX Loops" for "FX Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "FX Loops", isFile: false },
        [{ name: "boom.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Sound FX Loops");
    });
  });

  describe('when the directory name ends with " One Shots" or " One-Shots"', () => {
    it('sets sampleType to "Drum One Shots" for "Drum One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the plural form "Drums One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the hyphenated form "Drum One-Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum One-Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the "OneShots" form "Drum OneShots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum OneShots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the plural hyphenated form "Drums One-Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums One-Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drum one shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it("does not set sampleType when the base does not match", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonk One Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum One Shots", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it('sets sampleType to "Melody One Shots" for "Melody One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melody One Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody One Shots");
    });

    it('sets sampleType to "Melody One Shots" for the hyphenated form "Melody One-Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melody One-Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody One Shots");
    });
  });
});
