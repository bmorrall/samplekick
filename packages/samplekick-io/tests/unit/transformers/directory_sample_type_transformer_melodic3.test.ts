import { describe, expect, it } from "vitest";
import { createDirectorySampleTypeTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createDirectorySampleTypeTransformer", () => {
  describe('when the directory is named "Harp"', () => {
    it('sets sampleType to "Harp"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Harp", isFile: false },
        [{ name: "harp.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Harp");
    });

    it('sets sampleType to "Harp Loops" for "Harp Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Harp Loops", isFile: false },
        [{ name: "harp.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
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
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Pads");
    });

    it('sets sampleType to "Pad One Shots" for "Pad One Shots"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Pad One Shots", isFile: false },
        [{ name: "pad.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Pad One Shots");
    });
  });

  describe('when the directory is named "Cinematics"', () => {
    it('sets sampleType to "Cinematic"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cinematics", isFile: false },
        [{ name: "cinematic.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Cinematic");
    });

    it('sets sampleType to "Cinematic" for the singular form "Cinematic"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Cinematic", isFile: false },
        [{ name: "cinematic.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Cinematic");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "cinematics", isFile: false },
        [{ name: "cinematic.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Cinematic");
    });
  });

  describe('when the directory is named "Drones"', () => {
    it('sets sampleType to "Drones"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drones", isFile: false },
        [{ name: "drone.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drones");
    });

    it('sets sampleType to "Drones" for the singular form "Drone"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Drone", isFile: false },
        [{ name: "drone.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drones");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "drones", isFile: false },
        [{ name: "drone.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Drones");
    });
  });

  describe('when the directory is named "E-Piano"', () => {
    it('sets sampleType to "E-Piano"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "E-Piano", isFile: false },
        [{ name: "epiano.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("E-Piano");
    });

    it('sets sampleType to "E-Piano Loops" for "E-Piano Loops"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "E-Piano Loops", isFile: false },
        [{ name: "epiano.wav" }],
      );
      createDirectorySampleTypeTransformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("E-Piano Loops");
    });
  });
});
