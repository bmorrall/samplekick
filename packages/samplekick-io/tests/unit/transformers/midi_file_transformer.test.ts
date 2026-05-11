import { describe, expect, it } from "vitest";
import { createMidiFileTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createMidiFileTransformer", () => {
  describe("when the name ends with .mid", () => {
    it("sets sampleType to MIDI", () => {
      const entry = createTransformEntry({ name: "song.mid" });
      const transformer = createMidiFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("MIDI");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("sets sampleType to MIDI when extension is uppercase", () => {
      const entry = createTransformEntry({ name: "song.MID" });
      const transformer = createMidiFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("MIDI");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("prefixes an existing inherited sampleType with MIDI -", () => {
      const entry = createTransformEntry({ name: "song.mid", sampleType: "Drum Loops" });
      const transformer = createMidiFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("MIDI - Drum Loops");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });

    it("does not modify an entry that already has keepStructure set", () => {
      const entry = createTransformEntry({ name: "song.mid", keepStructure: true });
      const transformer = createMidiFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });
  });

  describe("when the path ends with .mid", () => {
    it("sets sampleType to MIDI when name does not include extension", () => {
      const entry = createTransformEntry({ name: "song", path: "midi/song.mid" });
      const transformer = createMidiFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("MIDI");
      expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
    });
  });

  describe("when the file is not a .mid file", () => {
    it("does not set sampleType for .wav files", () => {
      const entry = createTransformEntry({ name: "kick.wav" });
      const transformer = createMidiFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
      expect(entry.setKeepStructure).not.toHaveBeenCalled();
    });

    it("does not set sampleType for files whose name merely contains .mid", () => {
      const entry = createTransformEntry({ name: "midi_pack.zip" });
      const transformer = createMidiFileTransformer();
      transformer.transform(singleEntryTransformSource(entry));
      expect(entry.setSampleType).not.toHaveBeenCalled();
    });
  });
});
