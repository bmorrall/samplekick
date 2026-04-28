import { describe, expect, it } from "vitest";
import { DefaultPackageNameTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DefaultPackageNameTransformer", () => {
  it("should strip extension from root node name", () => {
    const entry = createTransformEntry({ name: "Example.zip" });
    DefaultPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Example");
  });

  it("should not change package name if no extension", () => {
    const entry = createTransformEntry({ name: "Example" });
    DefaultPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("should not change package name if not root node", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Parent" }],
      { name: "Example.zip", isFile: true },
    );
    DefaultPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("should do nothing if name is missing", () => {
    const entry = createTransformEntry({ name: "" });
    DefaultPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });
});
