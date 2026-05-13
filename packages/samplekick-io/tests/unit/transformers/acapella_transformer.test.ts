import { describe, expect, it } from "vitest";
import { createAcapellaTransformer } from "../../../src";
import {
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
  createTransformEntry,
} from "../../support";

const transformer = createAcapellaTransformer();

describe("createAcapellaTransformer", () => {
  describe('when the directory is named "Acapellas"', () => {
    it('sets sampleType to "Vocals - Acapellas"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas", isFile: false },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals - Acapellas");
    });

    it('sets sampleType to "Vocals - Acapellas" for the singular form "Acapella"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapella", isFile: false },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals - Acapellas");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "ACAPELLAS", isFile: false },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals - Acapellas");
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas", isFile: false, sampleType: "Existing" },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not act on files", () => {
      const entry = createTransformEntry({ name: "Acapellas", isFile: true });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe('when the directory is named "Acapellas and Vocals"', () => {
    it('sets sampleType to "Vocals - Acapellas"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas and Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals - Acapellas");
    });

    it('sets sampleType to "Vocals - Acapellas" for the "&" variant', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas & Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals - Acapellas");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "acapellas and vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals - Acapellas");
    });
  });

  describe("when the directory name does not match", () => {
    it("does not set sampleType for an unrelated folder name", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
