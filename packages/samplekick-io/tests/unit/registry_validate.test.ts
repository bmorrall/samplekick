import { describe, it, expect } from "vitest";
import { Registry } from "../../src";
import { createFileEntry, loadRegistry } from "../support";

describe("Registry.validate", () => {
  it("validate returns valid when all leaf nodes have packageName and sampleType", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const result = registry.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validate returns errors for leaf nodes missing tags", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "jazz/swing/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");

    const result = registry.validate();
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      { path: "jazz/bebop/track01", message: "Missing sampleType" },
      { path: "jazz/swing/track01", message: "Missing sampleType" },
    ]);
  });

  it("validateEntry returns valid for a subtree with all tags set", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [createFileEntry({ path: "jazz/bebop/track01" })]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const result = registry.validateEntry("jazz");
    expect(result.valid).toBe(true);
  });

  it("validateEntry scopes validation to the given path", () => {
    const registry = new Registry("library");
    loadRegistry(registry, [
      createFileEntry({ path: "jazz/bebop/track01" }),
      createFileEntry({ path: "rock/track01" }),
    ]);
    registry.setPackageName("jazz", "jazz-pack");
    registry.setSampleType("jazz", "Melodic Loops - Jazz");

    const result = registry.validateEntry("jazz");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validateEntry returns valid with no errors when the path does not exist", () => {
    const registry = new Registry("library");

    const result = registry.validateEntry("jazz");

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
