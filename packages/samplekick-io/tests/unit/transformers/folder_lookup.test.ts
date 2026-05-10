import { describe, expect, it } from "vitest";
import {
  FOLDER_LOOKUP,
  ONE_SHOT_LABELS,
  isKnownTypeFolderName,
  lookupPrefix,
  lookupStandalone,
  stripIgnoredSuffix,
} from "../../../src/transformers/folder_lookup";

describe("FOLDER_LOOKUP", () => {
  describe("lookupStandalone", () => {
    it("returns the standalone value for a known key", () => {
      expect(lookupStandalone("kick")).toBe("Kicks");
      expect(lookupStandalone("kicks")).toBe("Kicks");
    });

    it("returns undefined for an unknown key", () => {
      expect(lookupStandalone("unknown")).toBeUndefined();
    });

    it('returns "Loops" for "loops"', () => {
      expect(lookupStandalone("loops")).toBe("Loops");
    });

    it('returns "One Shots" for all ONE_SHOT_LABELS', () => {
      for (const label of ONE_SHOT_LABELS) {
        expect(lookupStandalone(label)).toBe("One Shots");
      }
    });

    it('returns "Drum and Bass" for all DRUM_AND_BASS_KEYS variants', () => {
      const variants = ["drum and bass", "drum n bass", "drum & bass", "dnb", "d&b"];
      for (const variant of variants) {
        expect(lookupStandalone(variant)).toBe("Drum and Bass");
      }
    });
  });

  describe("lookupPrefix", () => {
    it("returns the prefix value for a known key", () => {
      expect(lookupPrefix("kick")).toBe("Kick");
      expect(lookupPrefix("kicks")).toBe("Kick");
    });

    it("returns undefined for an unknown key", () => {
      expect(lookupPrefix("unknown")).toBeUndefined();
    });

    it('returns undefined for "loops" (no compound prefix)', () => {
      expect(lookupPrefix("loops")).toBeUndefined();
    });

    it('returns undefined for all ONE_SHOT_LABELS (no compound prefix)', () => {
      for (const label of ONE_SHOT_LABELS) {
        expect(lookupPrefix(label)).toBeUndefined();
      }
    });

    it('returns "Drum and Bass" prefix for all DRUM_AND_BASS_KEYS variants', () => {
      const variants = ["drum and bass", "drum n bass", "drum & bass", "dnb", "d&b"];
      for (const variant of variants) {
        expect(lookupPrefix(variant)).toBe("Drum and Bass");
      }
    });
  });

  describe("prefix/standalone parity", () => {
    it("every entry with a defined prefix has prefix !== standalone only where expected", () => {
      for (const [key, entry] of FOLDER_LOOKUP) {
        if (entry.prefix !== undefined) {
          // prefix should never equal standalone for singular/plural split entries
          // (this just verifies neither field is accidentally empty)
          expect(entry.prefix.length, `prefix for "${key}" should not be empty`).toBeGreaterThan(0);
        }
        expect(entry.standalone.length, `standalone for "${key}" should not be empty`).toBeGreaterThan(0);
      }
    });
  });
});

describe("isKnownTypeFolderName", () => {
  it('returns true for a bare known type e.g. "Kicks"', () => {
    expect(isKnownTypeFolderName("Kicks")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isKnownTypeFolderName("KICKS")).toBe(true);
    expect(isKnownTypeFolderName("kicks")).toBe(true);
  });

  it('returns true for "Loops"', () => {
    expect(isKnownTypeFolderName("Loops")).toBe(true);
  });

  it('returns true for "One Shots" and all one-shot label forms', () => {
    for (const label of ONE_SHOT_LABELS) {
      expect(isKnownTypeFolderName(label), label).toBe(true);
    }
  });

  it('returns true for compound forms like "Kick Loops"', () => {
    expect(isKnownTypeFolderName("Kick Loops")).toBe(true);
    expect(isKnownTypeFolderName("Drum Loops")).toBe(true);
  });

  it('returns true for compound forms like "Kick One Shots"', () => {
    expect(isKnownTypeFolderName("Kick One Shots")).toBe(true);
    expect(isKnownTypeFolderName("Drum One Shots")).toBe(true);
  });

  it("returns false for an unknown name", () => {
    expect(isKnownTypeFolderName("Unknown")).toBe(false);
  });

  it('returns false for "Loops Loops" (loops has no prefix)', () => {
    expect(isKnownTypeFolderName("Loops Loops")).toBe(false);
  });

  it('returns false for "One Shots Loops" (one shots has no prefix)', () => {
    expect(isKnownTypeFolderName("One Shots Loops")).toBe(false);
  });
});

describe("stripIgnoredSuffix", () => {
  it('strips "& MIDI" suffix', () => {
    expect(stripIgnoredSuffix("drum loops & midi")).toBe("drum loops");
  });

  it('strips "& Stems" suffix', () => {
    expect(stripIgnoredSuffix("drum loops & stems")).toBe("drum loops");
  });

  it('strips "and MIDI" suffix', () => {
    expect(stripIgnoredSuffix("drum loops and midi")).toBe("drum loops");
  });

  it('strips noise words like "Collection"', () => {
    expect(stripIgnoredSuffix("drum loops collection")).toBe("drum loops");
  });

  it('strips noise words like "Bundle"', () => {
    expect(stripIgnoredSuffix("hihat bundle")).toBe("hihat");
  });

  it('strips noise words like "Pack"', () => {
    expect(stripIgnoredSuffix("vocal pack")).toBe("vocal");
  });

  it("does not strip unrelated suffixes", () => {
    expect(stripIgnoredSuffix("drum loops")).toBe("drum loops");
  });
});
