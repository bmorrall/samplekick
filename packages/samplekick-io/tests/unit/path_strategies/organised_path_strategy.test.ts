import { describe, expect, it } from "vitest";
import { OrganisedPathStrategy } from "../../../src";
import { createFileNodeHierarchy } from "../../support";

describe("OrganisedPathStrategy", () => {
  it("returns sampleType/packageName/name when all metadata is present", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack" },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBe(
      "loops/my-pack/track01.wav",
    );
  });

  it("returns undefined when sampleType is missing", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", packageName: "my-pack" },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBeUndefined();
  });

  it("returns undefined when packageName is missing", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", sampleType: "loops" },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBeUndefined();
  });

  it("returns undefined when both sampleType and packageName are missing", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav" },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBeUndefined();
  });

  it("keeps the path from the grandparent node when it has keepStructure set", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: true },
      { name: "bebop", keepStructure: true },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBe(
      "loops/my-pack/jazz/bebop/track01.wav",
    );
  });

  it("keeps the path from the parent node when it has keepStructure set", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: false },
      { name: "bebop", keepStructure: true },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBe(
      "loops/my-pack/bebop/track01.wav",
    );
  });

  it("uses only the entry name when an explicit false overrides an inherited keepStructure", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: true },
      { name: "bebop", keepStructure: false },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBe(
      "loops/my-pack/track01.wav",
    );
  });

  it("keeps only the entry name when self has keepStructure set", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz", keepStructure: false },
      { name: "bebop", keepStructure: false },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack", keepStructure: true },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBe(
      "loops/my-pack/track01.wav",
    );
  });

  it("uses only the entry name when no keepStructure is set anywhere in the tree", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "jazz" },
      { name: "bebop" },
      { name: "track01.wav", sampleType: "loops", packageName: "my-pack" },
    ]);
    expect(OrganisedPathStrategy.destinationPathFor(leaf)).toBe(
      "loops/my-pack/track01.wav",
    );
  });
});
