import { describe, it, expect } from "vitest";
import { SimpleValidator } from "../../src/simple_validator";
import { createConfigEntry, createConfigSource } from "../support";

describe("SimpleValidator", () => {
  describe("validate", () => {
    it("skips the root entry when validating", () => {
      const configSource = createConfigSource([
        createConfigEntry({ path: "", packageName: undefined, sampleType: undefined }),
      ]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns valid when leafA has packageName and sampleType", () => {
      const configSource = createConfigSource([
        createConfigEntry({
          path: "leafA",
          packageName: "my-package",
          sampleType: "typeA",
        }),
      ]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns invalid when leafA is missing packageName", () => {
      const configSource = createConfigSource([
        createConfigEntry({ path: "leafA", sampleType: "typeA" }),
      ]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { path: "leafA", message: "Missing packageName" },
      ]);
    });

    it("returns invalid when leafA is missing sampleType", () => {
      const configSource = createConfigSource([
        createConfigEntry({ path: "leafA", packageName: "my-package" }),
      ]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { path: "leafA", message: "Missing sampleType" },
      ]);
    });

    it("returns errors for each missing field on leafA", () => {
      const configSource = createConfigSource([createConfigEntry({ path: "leafA" })]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { path: "leafA", message: "Missing packageName" },
        { path: "leafA", message: "Missing sampleType" },
      ]);
    });

    it("reports errors on leafA, not leafB, when only leafB is valid", () => {
      const configSource = createConfigSource([
        createConfigEntry({ path: "leafA" }),
        createConfigEntry({
          path: "leafB",
          packageName: "pkgB",
          sampleType: "typeA",
        }),
      ]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { path: "leafA", message: "Missing packageName" },
        { path: "leafA", message: "Missing sampleType" },
      ]);
    });

    it("reports errors on both leafA and leafB when both are invalid", () => {
      const configSource = createConfigSource([
        createConfigEntry({ path: "leafA" }),
        createConfigEntry({ path: "leafB" }),
      ]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { path: "leafA", message: "Missing packageName" },
        { path: "leafA", message: "Missing sampleType" },
        { path: "leafB", message: "Missing packageName" },
        { path: "leafB", message: "Missing sampleType" },
      ]);
    });

    it("reports errors on leafB when only leafA is valid", () => {
      // Inheritance is not handled by createConfigSource, so only direct values are checked
      const configSource = createConfigSource([
        createConfigEntry({
          path: "leafA",
          packageName: "my-package",
          sampleType: "typeA",
        }),
        createConfigEntry({ path: "leafB" }),
      ]);
      const validator = new SimpleValidator();
      const result = validator.validate(configSource);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([
        { path: "leafB", message: "Missing packageName" },
        { path: "leafB", message: "Missing sampleType" },
      ]);
    });
  });
});
