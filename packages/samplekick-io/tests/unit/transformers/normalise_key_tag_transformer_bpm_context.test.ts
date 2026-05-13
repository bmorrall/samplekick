import { describe, expect, it } from "vitest";
import { createNormaliseKeyTagTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

const transformer = createNormaliseKeyTagTransformer();

describe("createNormaliseKeyTagTransformer (BPM context bare minor)", () => {
  describe("bare Xm before BPM tag", () => {
    it("normalises C#m_120bpm (underscore sep) to C#min_120bpm", () => {
      const entry = createTransformEntry({ name: "Loop_C#m_120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_C#min_120bpm.wav");
    });

    it("normalises C#m 120bpm (space sep) to C#min 120bpm", () => {
      const entry = createTransformEntry({ name: "Loop C#m 120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop C#min 120bpm.wav");
    });

    it("normalises C#m120bpm (no sep) to C#min 120bpm (space inserted)", () => {
      const entry = createTransformEntry({ name: "Loop C#m120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop C#min 120bpm.wav");
    });

    it("normalises a natural-note root: Em_120bpm to Emin_120bpm", () => {
      const entry = createTransformEntry({ name: "Melody_Em_120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Melody_Emin_120bpm.wav");
    });

    it("normalises a flat root: Bbm_100bpm to Bbmin_100bpm", () => {
      const entry = createTransformEntry({ name: "Bass_Bbm_100bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Bass_Bbmin_100bpm.wav");
    });

    it("uppercases a lowercase root: c#m_120bpm to C#min_120bpm", () => {
      const entry = createTransformEntry({ name: "Loop_c#m_120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_C#min_120bpm.wav");
    });

    it("accepts a 2-digit BPM value: Am_99bpm to Amin_99bpm", () => {
      const entry = createTransformEntry({ name: "Loop_Am_99bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Amin_99bpm.wav");
    });
  });

  describe("bare Xm after BPM tag", () => {
    it("normalises 120bpm_C#m (underscore sep) to 120bpm_C#min", () => {
      const entry = createTransformEntry({ name: "Loop_120bpm_C#m.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_120bpm_C#min.wav");
    });

    it("normalises 120bpm C#m (space sep) to 120bpm C#min", () => {
      const entry = createTransformEntry({ name: "Loop 120bpm C#m.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop 120bpm C#min.wav");
    });

    it("normalises 120bpmC#m (no sep) to 120bpmC#min", () => {
      const entry = createTransformEntry({ name: "Loop_120bpmC#m.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_120bpmC#min.wav");
    });

    it("normalises 99bpm_Em (2-digit BPM) to 99bpm_Emin", () => {
      const entry = createTransformEntry({ name: "Loop_99bpm_Em.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_99bpm_Emin.wav");
    });

    it("uppercases a lowercase root: 120bpm_c#m to 120bpm_C#min", () => {
      const entry = createTransformEntry({ name: "Loop_120bpm_c#m.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_120bpm_C#min.wav");
    });
  });

  describe("already-normalised Xmin is not collapsed when adjacent to BPM", () => {
    it("leaves D#min 140bpm unchanged (does not consume 140 as chord extension)", () => {
      const entry = createTransformEntry({
        name: "Ayla_D#min 140bpm_Phrase.wav",
      });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith(
        "Ayla_D#min 140bpm_Phrase.wav",
      );
    });

    it("leaves Amin 120bpm unchanged", () => {
      const entry = createTransformEntry({ name: "Loop_Amin 120bpm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Amin 120bpm.wav");
    });
  });

  describe("does not act on bare Xm without BPM context", () => {
    it("leaves bare Cm unchanged when there is no BPM nearby", () => {
      const entry = createTransformEntry({ name: "Chord Cm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Chord Cm.wav");
    });

    it("leaves Cm unchanged when followed by a non-BPM number", () => {
      const entry = createTransformEntry({ name: "Loop_Cm_v1.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_Cm_v1.wav");
    });

    it("leaves Cm unchanged when a 3+ digit number precedes with no bpm suffix", () => {
      const entry = createTransformEntry({ name: "Loop_120_Cm.wav" });
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setName).toHaveBeenCalledWith("Loop_120_Cm.wav");
    });
  });
});
