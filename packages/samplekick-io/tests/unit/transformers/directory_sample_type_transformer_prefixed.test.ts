import { describe, expect, it } from "vitest";
import { createDirectorySampleTypeTransformer } from "../../../src";
import {
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createDirectorySampleTypeTransformer", () => {
  describe('when the directory name contains " and " or " & "', () => {
    it('does not set sampleType for "Acapellas and Vocals" (handled by AcapellaTransformer)', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas and Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it('does not set sampleType for "Acapellas & Vocals" (handled by AcapellaTransformer)', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas & Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when one part does not match", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas and Bonks", isFile: false },
        [{ name: "vocal.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when neither part matches", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonks and Arps", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas and Vocals", isFile: false, sampleType: "Custom" },
        [{ name: "vocal.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
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
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Drum Loops" for the plural form "Drums Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drum loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('sets sampleType to "Loops" when the base does not match a known type', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonk Loops", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Loops");
    });

    it('sets sampleType to "Loops" for a numbered prefix like "03. WAV Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "03. WAV Loops", isFile: false },
        [{ name: "808 Bass - 140bpm - G.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Loops");
    });

    it("does not set sampleType when the base does not match and a parent has a sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "Bonk Loops", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum Loops", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it('sets sampleType to "Melody Loops" for "Melody Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melody Loops", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody Loops");
    });

    it('sets sampleType to "Sound FX Loops" for "FX Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "FX Loops", isFile: false },
        [{ name: "boom.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
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
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the plural form "Drums One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the hyphenated form "Drum One-Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum One-Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the "OneShots" form "Drum OneShots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum OneShots", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "Drum One Shots" for the plural hyphenated form "Drums One-Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drums One-Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drum one shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum One Shots");
    });

    it('sets sampleType to "One Shots" when the base does not match a known type', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bonk One Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("One Shots");
    });

    it("does not set sampleType when the base does not match and a parent has a sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Drums", sampleType: "Drums" }],
        { name: "Bonk One Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum One Shots", isFile: false, sampleType: "Custom" },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not call setKeepStructure", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drum One Shots", isFile: false },
        [{ name: "kick.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it('sets sampleType to "Melody One Shots" for "Melody One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melody One Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody One Shots");
    });

    it('sets sampleType to "Melody One Shots" for the hyphenated form "Melody One-Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melody One-Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      const transformer = createDirectorySampleTypeTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melody One Shots");
    });
  });
});
