import { describe, expect, it } from "vitest";
import { createPathLengthValidator } from "../../../src/validators/path_length_validator";
import { createDigestEntry } from "../../support";

const entry = createDigestEntry({ path: "a/b.wav" });

describe("createPathLengthValidator", () => {
  it("returns undefined when path is within the limit", () => {
    const validator = createPathLengthValidator(10);
    expect(validator("a/b.wav", entry)).toBeUndefined();
  });

  it("returns undefined when path is exactly at the limit", () => {
    const validator = createPathLengthValidator(10);
    expect(validator("1234567890", entry)).toBeUndefined();
  });

  it("returns an error string when path exceeds the limit", () => {
    const validator = createPathLengthValidator(10);
    expect(validator("12345678901", entry)).toBe(
      "path too long: 11 characters (max 10)",
    );
  });

  it("error message includes the actual and max lengths", () => {
    const validator = createPathLengthValidator(127);
    const path = "a".repeat(130);
    const result = validator(path, entry);
    expect(result).toBe("path too long: 130 characters (max 127)");
  });

  describe("with pathPrefix option", () => {
    it("returns undefined when prefix + path is within the limit", () => {
      const validator = createPathLengthValidator(127, {
        pathPrefix: "Samples/",
      });
      expect(validator("a/b.wav", entry)).toBeUndefined();
    });

    it("returns undefined when prefix + path is exactly at the limit", () => {
      const validator = createPathLengthValidator(16, {
        pathPrefix: "Samples/",
      });
      // "Samples/" (8) + "12345678" (8) = 16
      expect(validator("12345678", entry)).toBeUndefined();
    });

    it("returns an error string when prefix + path exceeds the limit", () => {
      const validator = createPathLengthValidator(16, {
        pathPrefix: "Samples/",
      });
      // "Samples/" (8) + "123456789" (9) = 17
      expect(validator("123456789", entry)).toBe(
        "path too long: 8 + 9 = 17 characters (max 16)",
      );
    });

    it("error message shows prefix length, path length, total, and max", () => {
      const validator = createPathLengthValidator(127, {
        pathPrefix: "Samples/",
      });
      const path = "a".repeat(121);
      const result = validator(path, entry);
      // "Samples/" (8) + 121 = 129 characters
      expect(result).toBe("path too long: 8 + 121 = 129 characters (max 127)");
    });
  });
});
