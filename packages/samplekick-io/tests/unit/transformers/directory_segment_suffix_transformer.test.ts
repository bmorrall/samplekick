import { describe, expect, it } from "vitest";
import { createDirectorySegmentSuffixTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createDirectorySegmentSuffixTransformer", () => {
  describe("when a segment suffix resolves to a known type", () => {
    it('tags "Cymatics - Phoenix Vocal Loops" as "Vocal Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymatics - Phoenix Vocal Loops", isFile: false },
        [{ name: "loop.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocal Loops");
    });

    it('tags "Brand - My Drum Loops" as "Drum Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Brand - My Drum Loops", isFile: false },
        [{ name: "loop.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drum Loops");
    });

    it('tags "Label - Signature Vocals" as "Vocals"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Label - Signature Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals");
    });

    it('tags "Cymatics - Galaxy Tonal Ambience & Textures" as "Ambience and Textures"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymatics - Galaxy Tonal Ambience & Textures", isFile: false },
        [{ name: "sample.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ambience and Textures");
    });

    it('tags "Cymatics - Cyclone Ultimate Bass Collection" as "Bass" after stripping noise suffix', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymatics - Cyclone Ultimate Bass Collection", isFile: false },
        [{ name: "bass.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "cymatics - phoenix vocal loops", isFile: false },
        [{ name: "loop.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocal Loops");
    });
  });

  describe("when the directory already has a sampleType", () => {
    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymatics - Phoenix Vocal Loops", isFile: false, sampleType: "Loops" },
        [{ name: "loop.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when the condition is not met", () => {
    it("does not set sampleType when no segment has a matching suffix", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cymatics - Nebula Collection", isFile: false },
        [{ name: "sample.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when multiple segments each match a different type", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Brand - Signature Vocals - Phoenix Drum Loops", isFile: false },
        [{ name: "sample.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      // "Vocals" and "Drum Loops" both match — ambiguous.
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType when the name contains no ' - ' separator", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Vocal Loops", isFile: false },
        [{ name: "loop.wav" }],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType for a leaf node (no children)", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Brand - Phoenix Vocal Loops", isFile: true },
        [],
      );
      createDirectorySegmentSuffixTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
