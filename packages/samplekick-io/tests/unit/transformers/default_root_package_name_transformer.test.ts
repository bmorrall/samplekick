import { describe, expect, it } from "vitest";
import { DefaultRootPackageNameTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("DefaultRootPackageNameTransformer", () => {
  it("should strip extension from root node name", () => {
    const entry = createTransformEntry({ name: "Example.zip" });
    DefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Example");
  });

  it("should not change package name if no extension", () => {
    const entry = createTransformEntry({ name: "Example" });
    DefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("should not change package name if not root node", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Parent" }],
      { name: "Example.zip", isFile: true },
    );
    DefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("should do nothing if name is missing", () => {
    const entry = createTransformEntry({ name: "" });
    DefaultRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });
});
