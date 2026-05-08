import { describe, expect, it } from "vitest";
import { createDefaultRootPackageNameTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("createDefaultRootPackageNameTransformer", () => {
  it("should strip extension from root node name", () => {
    const entry = createTransformEntry({ name: "Example.zip" });
    createDefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Example");
  });

  it("should not change package name if no extension", () => {
    const entry = createTransformEntry({ name: "Example" });
    createDefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("should not change package name if not root node", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Parent" }],
      { name: "Example.zip", isFile: true },
    );
    createDefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("should do nothing if name is missing", () => {
    const entry = createTransformEntry({ name: "" });
    createDefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });
});
