import { describe, expect, it } from "vitest";
import { DirectorySampleTypeTransformer } from "../../../src";
import { createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DirectorySampleTypeTransformer", () => {
  describe('when the directory is named "Melodies"', () => {
    it('sets sampleType to "Melodies"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melodies", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodies");
    });

    it('sets sampleType to "Melodies" for the singular form "Melody"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Melody", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodies");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "melodies", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Melodies");
    });
  });

  describe('when the directory is named "Acapellas"', () => {
    it('sets sampleType to "Acapellas"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapellas", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Acapellas");
    });

    it('sets sampleType to "Acapellas" for the singular form "Acapella"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Acapella", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Acapellas");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "acapellas", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Acapellas");
    });
  });

  describe('when the directory is named "Ambience" or "Ambient"', () => {
    it('sets sampleType to "Ambience" for "Ambiences"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Ambiences", isFile: false },
        [{ name: "rain.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ambience");
    });

    it('sets sampleType to "Ambience" for "Ambience"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Ambience", isFile: false },
        [{ name: "rain.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ambience");
    });

    it('sets sampleType to "Ambience" for "Ambient"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Ambient", isFile: false },
        [{ name: "rain.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ambience");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "AMBIENT", isFile: false },
        [{ name: "rain.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Ambience");
    });
  });

  describe('when the directory is named "Bass"', () => {
    it('sets sampleType to "Bass"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Bass", isFile: false },
        [{ name: "bass.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass");
    });

    it('sets sampleType to "Bass" for "Basses"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Basses", isFile: false },
        [{ name: "bass.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "bass", isFile: false },
        [{ name: "bass.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Bass");
    });
  });

  describe('when the directory is named "Keys"', () => {
    it('sets sampleType to "Keys"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Keys", isFile: false },
        [{ name: "keys.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Keys");
    });

    it('sets sampleType to "Keys" for the singular form "Key"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Key", isFile: false },
        [{ name: "keys.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Keys");
    });

    it('sets sampleType to "Keys" for "Keyboard"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Keyboard", isFile: false },
        [{ name: "keys.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Keys");
    });

    it('sets sampleType to "Keys" for "Keyboards"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Keyboards", isFile: false },
        [{ name: "keys.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Keys");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "keyboards", isFile: false },
        [{ name: "keys.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Keys");
    });
  });

  describe('when the directory is named "Sound FX"', () => {
    it('sets sampleType to "Sound FX"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Sound FX", isFile: false },
        [{ name: "boom.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Sound FX");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "sound fx", isFile: false },
        [{ name: "boom.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Sound FX");
    });

    it('sets sampleType to "Sound FX" for "FX"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "FX", isFile: false },
        [{ name: "boom.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Sound FX");
    });

    it('sets sampleType to "Sound FX" for "fx" (case-insensitive)', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "fx", isFile: false },
        [{ name: "boom.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Sound FX");
    });
  });

  describe('when the directory is named "Foley"', () => {
    it('sets sampleType to "Foley"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Foley", isFile: false },
        [{ name: "creak.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Foley");
    });

    it('sets sampleType to "Foley" for "Foleys"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Foleys", isFile: false },
        [{ name: "creak.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Foley");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "foley", isFile: false },
        [{ name: "creak.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Foley");
    });
  });

  describe('when the directory is named "Flute"', () => {
    it('sets sampleType to "Flute"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Flute", isFile: false },
        [{ name: "flute.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Flute");
    });

    it('sets sampleType to "Flute" for "Flutes"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Flutes", isFile: false },
        [{ name: "flute.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Flute");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "flutes", isFile: false },
        [{ name: "flute.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Flute");
    });
  });

  describe('when the directory is named "Guitar"', () => {
    it('sets sampleType to "Guitar"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Guitar", isFile: false },
        [{ name: "guitar.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Guitar");
    });

    it('sets sampleType to "Guitar" for "Guitars"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Guitars", isFile: false },
        [{ name: "guitar.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Guitar");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "guitars", isFile: false },
        [{ name: "guitar.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Guitar");
    });
  });

  describe('when the directory is named "Piano"', () => {
    it('sets sampleType to "Piano"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Piano", isFile: false },
        [{ name: "piano.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Piano");
    });

    it('sets sampleType to "Piano" for "Pianos"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Pianos", isFile: false },
        [{ name: "piano.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Piano");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "pianos", isFile: false },
        [{ name: "piano.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Piano");
    });
  });

  describe('when the directory is named "Textures"', () => {
    it('sets sampleType to "Textures"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Textures", isFile: false },
        [{ name: "texture.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Textures");
    });

    it('sets sampleType to "Textures" for the singular form "Texture"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Texture", isFile: false },
        [{ name: "texture.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Textures");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "textures", isFile: false },
        [{ name: "texture.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Textures");
    });
  });

  describe('when the directory is named "Synths"', () => {
    it('sets sampleType to "Synths"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Synths", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Synths");
    });

    it('sets sampleType to "Synths" for the singular form "Synth"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Synth", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Synths");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "synths", isFile: false },
        [{ name: "lead.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Synths");
    });
  });

  describe('when the directory is named "Vocals"', () => {
    it('sets sampleType to "Vocals"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals");
    });

    it('sets sampleType to "Vocals" for the singular form "Vocal"', () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "Vocal", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals");
    });

    it("matches case-insensitively", () => {
      const entry = createTransformEntryInHierarchy(
        [],
        { name: "vocals", isFile: false },
        [{ name: "vocal.wav" }],
      );
      DirectorySampleTypeTransformer(singleEntryTransformSource(entry));
      expect(entry.setSampleType).toHaveBeenCalledWith("Vocals");
    });
  });
});
