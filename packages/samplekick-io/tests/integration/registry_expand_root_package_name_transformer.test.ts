import { describe, it, expect } from "vitest";
import {
  createDefaultRootPackageNameTransformer,
  createExpandRootPackageNameTransformer,
  OrganisedPathStrategy,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("ExpandRootPackageNameTransformer integration", () => {
  it("applies createExpandRootPackageNameTransformer to expand CamelCase packageName", () => {
    const registry = createRegistry("CoolPack-v2.zip", [
      createFileEntry({ path: "Drums/kick.wav" }),
    ]);
    registry.applyTransform(createDefaultRootPackageNameTransformer());
    registry.applyTransform(createExpandRootPackageNameTransformer());
    registry.setSampleType("drums");
    registry.setPathStrategy(OrganisedPathStrategy);
    expect(registry.destinationPathFor("Drums/kick.wav")).toBe(
      "drums/Cool Pack - v2/kick.wav",
    );
  });
});
