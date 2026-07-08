import { describe, expect, it } from "vitest";
import { createReorderBpmKeyTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

const transformer = createReorderBpmKeyTransformer();

describe("createReorderBpmKeyTransformer", () => {
  describe("reorders BPM-before-key to key-before-BPM", () => {
    it("reorders 120bpm_Amin (underscore sep) to Amin_120bpm", () => {
      const entry = createTransformEntry({ name: "Loop_120bpm_Amin.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Amin_120bpm.wav");
    });

    it("reorders 120bpm Amin (space sep) to Amin 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm Amin.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Amin 120bpm.wav");
    });

    it("reorders with maj quality: 120bpm_Cmaj to Cmaj_120bpm", () => {
      const entry = createTransformEntry({ name: "Chords_120bpm_Cmaj.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chords_Cmaj_120bpm.wav");
    });

    it("reorders with numeric extension: 120bpm Cmaj7 to Cmaj7 120bpm", () => {
      const entry = createTransformEntry({ name: "Chord 120bpm Cmaj7.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj7 120bpm.wav");
    });

    it("reorders with sus2: 120bpm Csus2 to Csus2 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm Csus2.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Csus2 120bpm.wav");
    });

    it("reorders with sus4: 120bpm Csus4 to Csus4 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm Csus4.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Csus4 120bpm.wav");
    });

    it("reorders with dim7: 120bpm Cdim7 to Cdim7 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm Cdim7.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Cdim7 120bpm.wav");
    });

    it("reorders with aug: 120bpm Caug to Caug 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm Caug.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Caug 120bpm.wav");
    });

    it("reorders with hdim: 120bpm Chdim7 to Chdim7 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm Chdim7.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Chdim7 120bpm.wav");
    });

    it("reorders with minMaj: 120bpm CminMaj7 to CminMaj7 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm CminMaj7.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop CminMaj7 120bpm.wav");
    });

    it("reorders with a 2-digit BPM: 99bpm Amin to Amin 99bpm", () => {
      const entry = createTransformEntry({ name: "Loop 99bpm Amin.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Amin 99bpm.wav");
    });

    it("reorders with an accidental root: 120bpm_F#min to F#min_120bpm", () => {
      const entry = createTransformEntry({ name: "Loop_120bpm_F#min.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_F#min_120bpm.wav");
    });

    it("reorders with a flat root: 100bpm_Bbmin to Bbmin_100bpm", () => {
      const entry = createTransformEntry({ name: "Loop_100bpm_Bbmin.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Bbmin_100bpm.wav");
    });

    it("reorders 150bpm - D#min (hyphen-spaced sep) to D#min 150bpm", () => {
      const entry = createTransformEntry({
        name: "Holiday Kit 03 - 150bpm - D#min.wav",
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith(
        "Holiday Kit 03 - D#min 150bpm.wav",
      );
    });

    it("reorders 120bpm - Cmaj (hyphen-spaced sep) to Cmaj 120bpm", () => {
      const entry = createTransformEntry({
        name: "Kick - 120bpm - Cmaj.wav",
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Kick - Cmaj 120bpm.wav");
    });

    it("reorders 120bpm_-_Amin (underscore-hyphen sep) to Amin_120bpm", () => {
      const entry = createTransformEntry({ name: "Loop_120bpm_-_Amin.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Amin_120bpm.wav");
    });
  });

  describe("does not act when key already precedes BPM", () => {
    it("leaves Amin_120bpm unchanged", () => {
      const entry = createTransformEntry({ name: "Loop_Amin_120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Amin_120bpm.wav");
    });

    it("leaves Cmaj 90bpm unchanged", () => {
      const entry = createTransformEntry({ name: "Chord Cmaj 90bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cmaj 90bpm.wav");
    });
  });

  describe("strips hyphen separator when key already precedes BPM", () => {
    it("strips ' - ' from Cmaj - 120bpm to Cmaj 120bpm", () => {
      const entry = createTransformEntry({ name: "Kick - Cmaj - 120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Kick - Cmaj 120bpm.wav");
    });

    it("strips '_-_' from Amin_-_120bpm to Amin_120bpm", () => {
      const entry = createTransformEntry({ name: "Loop_Amin_-_120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Amin_120bpm.wav");
    });

    it("does not strip a plain space separator: Amin 120bpm unchanged", () => {
      const entry = createTransformEntry({ name: "Loop Amin 120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop Amin 120bpm.wav");
    });
  });

  describe("does not act on non-canonical forms", () => {
    it("does not act on non-normalised BPM token (120BPM_Amin)", () => {
      const entry = createTransformEntry({ name: "Loop_120BPM_Amin.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_120BPM_Amin.wav");
    });

    it("does not act on 120bpmAmin (no separator)", () => {
      const entry = createTransformEntry({ name: "Loop_120bpmAmin.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_120bpmAmin.wav");
    });

    it("does not act on non-normalised key token (120bpm_Am)", () => {
      const entry = createTransformEntry({ name: "Loop_120bpm_Am.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_120bpm_Am.wav");
    });

    it("does not act on a name with no BPM-before-key pattern", () => {
      const entry = createTransformEntry({ name: "kick drum.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("kick drum.wav");
    });
  });

  it("reorders packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "120bpm Amin Loops",
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Amin 120bpm Loops");
  });

  it("reorders sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "120bpm Cmaj",
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Cmaj 120bpm");
  });

  it("does not act on a keepStructure entry", () => {
    const entry = createTransformEntry({
      name: "120bpm Amin.wav",
      readOnly: true,
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on a skipped entry", () => {
    const entry = createTransformEntry({
      name: "120bpm Amin.wav",
      enabled: false,
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
