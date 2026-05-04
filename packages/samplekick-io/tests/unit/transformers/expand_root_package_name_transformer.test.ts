import { describe, expect, it } from "vitest";
import { ExpandRootPackageNameTransformer } from "../../../src";
import { createTransformEntry, createTransformEntryInHierarchy, singleEntryTransformSource } from "../../support";

describe("ExpandRootPackageNameTransformer", () => {
  it("expands CamelCase packageName into space-separated words", () => {
    const entry = createTransformEntry({ name: "CoolPack.zip", packageName: "CoolPack" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Cool Pack");
  });

  it("expands CamelCase packageName with a hyphen-separated suffix", () => {
    const entry = createTransformEntry({ name: "CamelCase-rev1.zip", packageName: "CamelCase-rev1" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Camel Case - rev1");
  });

  it("handles acronym runs correctly", () => {
    const entry = createTransformEntry({ name: "MyXMLParser.zip", packageName: "MyXMLParser" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("My XML Parser");
  });

  it("does not expand a packageName that already has spaces", () => {
    const entry = createTransformEntry({ name: "Cool Pack.zip", packageName: "Cool Pack" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not expand a kebab-case packageName with no CamelCase", () => {
    const entry = createTransformEntry({ name: "cool-pack.zip", packageName: "cool-pack" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("spaces a letter-left hyphen even when right side is a digit", () => {
    const entry = createTransformEntry({ name: "BitPack-8bit.zip", packageName: "BitPack-8bit" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Bit Pack - 8bit");
  });

  it("spaces a letter-left hyphen before a digit like CoolPack-8bit", () => {
    const entry = createTransformEntry({ name: "CoolPack-8bit.zip", packageName: "CoolPack-8bit" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Cool Pack - 8bit");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "CoolPack.zip" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setName", () => {
    const entry = createTransformEntry({ name: "CoolPack.zip", packageName: "CoolPack" });
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on non-root entries", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Parent" }],
      { name: "CoolPack.zip", isFile: true },
    );
    ExpandRootPackageNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });
});
