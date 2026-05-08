import { describe, expect, it } from "vitest";
import { createPathLengthValidator } from "../../../src/validators/path_length_validator";
import { createConfigEntry } from "../../support";

const entry = createConfigEntry({ path: "a/b.wav" });

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
});
