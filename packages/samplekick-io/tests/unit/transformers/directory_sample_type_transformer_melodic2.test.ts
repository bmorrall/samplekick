import { describe, expect, it } from "vitest";
import { DirectorySampleTypeTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DirectorySampleTypeTransformer", () => {
  describe('when the directory is named "Melodic"', () => {
    it('sets sampleType to "Melodic"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melodic", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic");
    });

    it('sets sampleType to "Melodic One Shots" for "Melodic One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melodic One Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic One Shots");
    });

    it('sets sampleType to "Melodic One Shots" for the hyphenated form "Melodic One-Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melodic One-Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic One Shots");
    });

    it('sets sampleType to "Melodic Loops" for "Melodic Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melodic Loops", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic Loops");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "melodic", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic");
    });
  });

  describe('when the directory is named "Melodics"', () => {
    it('sets sampleType to "Melodic"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melodics", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic");
    });

    it('sets sampleType to "Melodic Loops" for a "Loops" child', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodics", sampleType: "Melodic" }],
        { name: "Loops", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic Loops");
    });

    it('sets sampleType to "Melodic One Shots" for a "One Shots" child', () => {
      const entry = createTransformEntryInHierarchy(
        [{ name: "Melodics", sampleType: "Melodic" }],
        { name: "One Shots", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic One Shots");
    });

    it('sets sampleType to "Melodic Loops - Lofi" for a "Lofi" child under "Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [
          { name: "Melodics", sampleType: "Melodic" },
          { name: "Loops", sampleType: "Melodic Loops" },
        ],
        { name: "Lofi", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodic Loops - Lofi");
    });
  });
});
