import { describe, expect, it } from "vitest";
import { SourcePathStrategy } from "../../../src";
import { createFileNodeHierarchy } from "../../support";

describe("SourcePathStrategy", () => {
  it("returns the path from the entry", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "grandparent" },
      { name: "parent" },
      { name: "self" },
    ]);
    expect(SourcePathStrategy.destinationPathFor(leaf)).toBe(
      "grandparent/parent/self",
    );
  });

  it("returns undefined when only the root node is passed", () => {
    const root = createFileNodeHierarchy("example.zip", []);
    expect(SourcePathStrategy.destinationPathFor(root)).toBeUndefined();
  });
});
