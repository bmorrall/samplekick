import { describe, expect, it } from "vitest";
import { SourcePathStrategy, PathResult } from "../../../src";
import { createFileNodeHierarchy } from "../../support";

describe("SourcePathStrategy", () => {
  it("returns the path from the entry", () => {
    const leaf = createFileNodeHierarchy("example.zip", [
      { name: "grandparent" },
      { name: "parent" },
      { name: "self" },
    ]);
    const result = SourcePathStrategy.destinationPathFor(leaf);
    expect(result).toBeInstanceOf(PathResult);
    expect(result).toHaveProperty("path", "grandparent/parent/self");
  });
});
