import { describe, expect, it } from "vitest";
import { KnownFileTypeTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("KnownFileTypeTransformer", () => {
  describe("when the name ends with .mid", () => {
    it("sets sampleType to MIDI", () => {
      const entry = createTransformEntry({ name: "song.mid" });
      KnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("MIDI");
    });

    it("sets sampleType to MIDI when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "song.MID" });
      KnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("MIDI");
    });

    it("does not overwrite an existing sampleType", () => {
      const entry = createTransformEntry({ name: "song.mid", sampleType: "custom" });
      KnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });

  describe("when the path ends with .mid", () => {
    it("sets sampleType to MIDI when name does not include extension", () => {
      const entry = createTransformEntry({ name: "song", path: "midi/song.mid" });
      KnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("MIDI");
    });
  });

  describe("when the file is not a .mid file", () => {
    it("does not set sampleType for .wav files", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      KnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });

    it("does not set sampleType for files whose name merely contains .mid", () => {
      const entry = createTransformEntry({ name: "midi_pack.zip" });
      KnownFileTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
