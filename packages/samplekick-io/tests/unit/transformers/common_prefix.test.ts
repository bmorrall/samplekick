import { describe, expect, it } from "vitest";
import {
  longestCommonPrefix,
  prefixMatches,
  trimToWordBoundary,
} from "../../../src/transformers/common_prefix";

describe("longestCommonPrefix", () => {
  it("returns the shared prefix of multiple strings", () => {
    expect(
      longestCommonPrefix([
        "SH Alien Technology Alarm.wav",
        "SH Alien Technology Ship.wav",
      ]),
    ).toBe("SH Alien Technology ");
  });

  it("returns the whole string when only one string is given", () => {
    expect(longestCommonPrefix(["Solo.wav"])).toBe("Solo.wav");
  });

  it("returns an empty string when given an empty array", () => {
    expect(longestCommonPrefix([])).toBe("");
  });

  it("returns an empty string when strings share no prefix", () => {
    expect(longestCommonPrefix(["Kick.wav", "Snare.wav"])).toBe("");
  });

  it("treats a shared space/underscore position as a match, normalising it to a space", () => {
    expect(
      longestCommonPrefix([
        "SH_Braam_Attention_F.wav",
        "SH Braam Erratic Cry A.wav",
      ]),
    ).toBe("SH Braam ");
  });

  it("still stops at the first point of true divergence", () => {
    expect(longestCommonPrefix(["SH_Braam_A.wav", "SH_Broom_B.wav"])).toBe(
      "SH Br",
    );
  });

  it("treats a shared hyphen/space position as a match, normalising it to a space", () => {
    expect(
      longestCommonPrefix([
        "Ghosthack-OSS Kit Aftershock Bass.wav",
        "Ghosthack OSS Kit Aftershock Chords.wav",
      ]),
    ).toBe("Ghosthack OSS Kit Aftershock ");
  });
});

describe("trimToWordBoundary", () => {
  it("returns the prefix unchanged when it already ends on a space", () => {
    expect(trimToWordBoundary("SH Alien Technology ")).toBe(
      "SH Alien Technology ",
    );
  });

  it("trims back to the last separator when the prefix ends mid-word", () => {
    expect(trimToWordBoundary("SH Alien Tech")).toBe("SH Alien ");
  });

  it("trims back to an underscore boundary", () => {
    expect(trimToWordBoundary("Ghosthack_SH_Alie")).toBe("Ghosthack_SH_");
  });

  it("trims back to a hyphen boundary", () => {
    expect(trimToWordBoundary("Ghosthack-OSS")).toBe("Ghosthack-");
  });

  it("returns undefined when there is no separator boundary", () => {
    expect(trimToWordBoundary("SH")).toBeUndefined();
  });

  it("returns undefined when trimming would leave fewer than 2 characters", () => {
    expect(trimToWordBoundary(" A")).toBeUndefined();
  });
});

describe("prefixMatches", () => {
  it("returns true for an exact match", () => {
    expect(prefixMatches("SH Braam Attention.wav", "SH Braam ")).toBe(true);
  });

  it("treats a space in the prefix as matching an underscore in the name", () => {
    expect(prefixMatches("SH_Braam_Attention.wav", "SH Braam ")).toBe(true);
  });

  it("treats an underscore in the prefix as matching a space in the name", () => {
    expect(prefixMatches("SH Braam Attention.wav", "SH_Braam_")).toBe(true);
  });

  it("returns false when a non-separator character differs", () => {
    expect(prefixMatches("SH Broom Attention.wav", "SH Braam ")).toBe(false);
  });

  it("returns false when the name is shorter than the prefix", () => {
    expect(prefixMatches("SH", "SH Braam ")).toBe(false);
  });

  it("treats a hyphen in the name as matching a space in the prefix", () => {
    expect(prefixMatches("Ghosthack-OSS Kit.wav", "Ghosthack OSS Kit")).toBe(
      true,
    );
  });
});
