import { describe, expect, it } from "vitest";
import { OrganisedPathStrategy, PathResult, SkipResult } from "../../../src";
import { createFileNodeHierarchy } from "../../support";

describe("OrganisedPathStrategy", () => {
  it("returns sampleType/packageName/name when all metadata is present", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack" },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(PathResult);
    expect(result).toHaveProperty("path", "loops/my-pack/track01.wav");
  });

  it("returns skip result when sampleType is missing", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", packageName: "my-pack" },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(SkipResult);
    expect(result).toHaveProperty("reason", "Missing sampleType");
  });

  it("returns skip result when packageName is missing", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", sampleType: "loops" },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(SkipResult);
    expect(result).toHaveProperty("reason", "Missing packageName");
  });

  it("returns skip result when both sampleType and packageName are missing", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav" },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(SkipResult);
    expect(result).toHaveProperty("reason", "Missing sampleType and packageName");
  });

  it("keeps the path from the grandparent node when it has keepStructure set", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: true },
      { name: "bebop", keepStructure: true },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(PathResult);
    expect(result).toHaveProperty("path", "loops/my-pack/jazz/bebop/track01.wav");
  });

  it("keeps the path from the parent node when it has keepStructure set", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: false },
      { name: "bebop", keepStructure: true },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(PathResult);
    expect(result).toHaveProperty("path", "loops/my-pack/bebop/track01.wav");
  });

  it("uses only the entry name when an explicit false overrides an inherited keepStructure", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: true },
      { name: "bebop", keepStructure: false },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(PathResult);
    expect(result).toHaveProperty("path", "loops/my-pack/track01.wav");
  });

  it("keeps only the entry name when self has keepStructure set", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: false },
      { name: "bebop", keepStructure: false },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(PathResult);
    expect(result).toHaveProperty("path", "loops/my-pack/track01.wav");
  });

  it("uses only the entry name when no keepStructure is set anywhere in the tree", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack" },
    ]);
    const result = OrganisedPathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(PathResult);
    expect(result).toHaveProperty("path", "loops/my-pack/track01.wav");
  });
});
