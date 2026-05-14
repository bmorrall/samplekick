import { describe, expect, it } from "vitest";
import { createNoPacksValidator } from "../../../src/validators/no_packs_validator";
import { createDigestEntry } from "../../support";

const validator = createNoPacksValidator();

describe("createNoPacksValidator", () => {
  it("returns undefined when sampleType is not Packs", () => {
    const entry = createDigestEntry({ path: "a/b.wav", sampleType: "Drums" });
    expect(validator("a/b.wav", entry)).toBeUndefined();
  });

  it("returns undefined when sampleType is not set", () => {
    const entry = createDigestEntry({ path: "a/b.wav" });
    expect(validator("a/b.wav", entry)).toBeUndefined();
  });

  it("returns an error string when sampleType is Packs", () => {
    const entry = createDigestEntry({ path: "a/b.wav", sampleType: "Packs" });
    expect(validator("a/b.wav", entry)).toBe("entry is categorised as 'Packs'");
  });

  it("error message includes the Packs type name", () => {
    const entry = createDigestEntry({
      path: "deep/path/kick.wav",
      sampleType: "Packs",
    });
    const result = validator("deep/path/kick.wav", entry);
    expect(result).toContain("'Packs'");
  });
});
