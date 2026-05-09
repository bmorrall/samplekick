import { describe, expect, it } from "vitest";
import { createNormaliseKeyTagTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createNormaliseKeyTagTransformer", () => {
  describe("major quality", () => {
    it("normalises C Major (spaced) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Loop C Major.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cmaj.wav");
    });

    it("normalises C_Major (underscore) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Loop C_Major.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cmaj.wav");
    });

    it("normalises Cmajor (no separator) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Loop Cmajor.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cmaj.wav");
    });

    it("normalises C maj (short form) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Loop C maj.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cmaj.wav");
    });

    it("normalises C_maj (underscore short form) to Cmaj", () => {
      const entry = createTransformEntry({ name: "Loop C_maj.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cmaj.wav");
    });
  });

  describe("minor quality", () => {
    it("normalises F# Minor (spaced, sharp) to F#min", () => {
      const entry = createTransformEntry({ name: "Loop F# Minor.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop F#min.wav");
    });

    it("normalises Dbminor (flat, no separator) to Dbmin", () => {
      const entry = createTransformEntry({ name: "Loop Dbminor.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Dbmin.wav");
    });

    it("normalises A_min (underscore short form) to Amin", () => {
      const entry = createTransformEntry({ name: "Loop A_min.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Amin.wav");
    });
  });

  describe("case handling", () => {
    it("uppercases a lowercase root note", () => {
      const entry = createTransformEntry({ name: "Loop c major.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cmaj.wav");
    });

    it("leaves an already canonical Cmaj unchanged", () => {
      const entry = createTransformEntry({ name: "Loop Cmaj.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cmaj.wav");
    });
  });

  describe("does not act on non-key-tag content", () => {
    it("does not match a note letter embedded in a word", () => {
      const entry = createTransformEntry({ name: "grab min stuff.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("grab min stuff.wav");
    });

    it("does not match a quality suffix embedded in a word", () => {
      const entry = createTransformEntry({ name: "Cmajority.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Cmajority.wav");
    });

    it("leaves a name with no key tag unchanged", () => {
      const entry = createTransformEntry({ name: "kick drum.wav" });
      createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("kick drum.wav");
    });
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "Loops F# Minor" });
    createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Loops F#min");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Loops C Major" });
    createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Loops Cmaj");
  });

  it("does not act on a keepStructure entry", () => {
    const entry = createTransformEntry({ name: "Loop C Major.wav", keepStructure: true });
    createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on a skipped entry", () => {
    const entry = createTransformEntry({ name: "Loop C Major.wav", skipped: true });
    createNormaliseKeyTagTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
