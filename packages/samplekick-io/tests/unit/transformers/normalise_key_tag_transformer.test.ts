import { describe, expect, it } from "vitest";
import { createNormaliseKeyTagTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createNormaliseKeyTagTransformer", () => {
  describe("major quality", () => {
    it("normalises C Major (spaced) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Chord C Major.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj.wav");
    });

    it("normalises C_Major (underscore) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Chord C_Major.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj.wav");
    });

    it("normalises Cmajor (no separator) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Chord Cmajor.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj.wav");
    });

    it("normalises C maj (short form) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Chord C maj.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj.wav");
    });

    it("normalises C_maj (underscore short form) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Chord C_maj.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj.wav");
    });
  });

  describe("minor quality", () => {
    it("normalises F# Minor (spaced, sharp) to F#min", () => {
      const entry = createTransformEntry({ name: "Chord F# Minor.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord F#min.wav");
    });

    it("normalises Dbminor (flat, no separator) to Dbmin", () => {
      const entry = createTransformEntry({ name: "Chord Dbminor.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Dbmin.wav");
    });

    it("normalises A_min (underscore short form) to Amin", () => {
      const entry = createTransformEntry({ name: "Chord A_min.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Amin.wav");
    });
  });

  describe("case handling", () => {
    it("uppercases a lowercase root note", () => {
      const entry = createTransformEntry({ name: "Chord c major.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj.wav");
    });

    it("leaves an already canonical Cmaj unchanged", () => {
      const entry = createTransformEntry({ name: "Chord Cmaj.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj.wav");
    });
  });

  describe("does not act on non-key-tag content", () => {
    it("does not match a note letter embedded in a word", () => {
      const entry = createTransformEntry({ name: "grab min stuff.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("grab min stuff.wav");
    });

    it("does not match a quality suffix embedded in a word", () => {
      const entry = createTransformEntry({ name: "Cmajority.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Cmajority.wav");
    });

    it("leaves a name with no key tag unchanged", () => {
      const entry = createTransformEntry({ name: "kick drum.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("kick drum.wav");
    });
  });

  describe("sus quality", () => {
    it("normalises G sus2 (spaced) to Gsus2", () => {
      const entry = createTransformEntry({ name: "Chord G sus2.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus2.wav");
    });

    it("normalises G_sus2 (underscore) to Gsus2", () => {
      const entry = createTransformEntry({ name: "Chord G_sus2.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus2.wav");
    });

    it("normalises Gsus2 (no separator) to Gsus2 unchanged", () => {
      const entry = createTransformEntry({ name: "Chord Gsus2.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus2.wav");
    });

    it("normalises G sus4 (spaced) to Gsus4", () => {
      const entry = createTransformEntry({ name: "Chord G sus4.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus4.wav");
    });

    it("uppercases a lowercase root in sus quality", () => {
      const entry = createTransformEntry({ name: "Chord g sus2.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus2.wav");
    });

    it("uppercases a lowercase root in sus2add4", () => {
      const entry = createTransformEntry({ name: "Chord gsus2add4.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus2add4.wav");
    });

    it("collapses g sus2 add4 (spaced) to Gsus2add4", () => {
      const entry = createTransformEntry({ name: "Chord g sus2 add4.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus2add4.wav");
    });

    it("leaves Gsus2add4 with uppercase root unchanged", () => {
      const entry = createTransformEntry({ name: "Chord Gsus2add4.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Gsus2add4.wav");
    });
  });

  describe("dim quality", () => {
    it("normalises C dim (spaced) to Cdim", () => {
      const entry = createTransformEntry({ name: "Chord C dim.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cdim.wav");
    });

    it("normalises C_dim7 (underscore) to Cdim7", () => {
      const entry = createTransformEntry({ name: "Chord C_dim7.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cdim7.wav");
    });

    it("uppercases a lowercase root in dim quality", () => {
      const entry = createTransformEntry({ name: "Chord c dim.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cdim.wav");
    });

    it("leaves Cdim7 with uppercase root unchanged", () => {
      const entry = createTransformEntry({ name: "Chord Cdim7.wav" });
      const transformer = createNormaliseKeyTagTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cdim7.wav");
    });
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "Loops F# Minor",
    });
    const transformer = createNormaliseKeyTagTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Loops F#min");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "Loops C Major",
    });
    const transformer = createNormaliseKeyTagTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Loops Cmaj");
  });

  it("does not act on a keepStructure entry", () => {
    const entry = createTransformEntry({
      name: "Chord C Major.wav",
      keepStructure: true,
    });
    const transformer = createNormaliseKeyTagTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on a skipped entry", () => {
    const entry = createTransformEntry({
      name: "Chord C Major.wav",
      skipped: true,
    });
    const transformer = createNormaliseKeyTagTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
