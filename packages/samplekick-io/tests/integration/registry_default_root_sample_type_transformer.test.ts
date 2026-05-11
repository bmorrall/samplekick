import { describe, it, expect } from "vitest";
import {
  createDefaultRootPackageNameTransformer,
  createDefaultRootSampleTypeTransformer,
  OrganisedPathStrategy,
} from "../../src";
import { createRegistry, createFileEntry } from "../support";

describe("DefaultRootSampleTypeTransformer integration", () => {
  it("sets sampleType to Packs on the root node", () => {
    const registry = createRegistry("MyProject.zip", [
      createFileEntry({ path: "sub1/file1.wav" }),
      createFileEntry({ path: "file2.wav" }),
    ]);
    registry.applyTransform(createDefaultRootPackageNameTransformer());
    registry.applyTransform(createDefaultRootSampleTypeTransformer());
    expect(registry.toString()).toBe(
      [
        "MyProject.zip [pkg:MyProject, type:Packs]",
        "├── sub1",
        "│   └── file1.wav",
        "└── file2.wav",
        "",
      ].join("\n"),
    );
  });

  it("does not overwrite an existing sampleType on the root node", () => {
    const registry = createRegistry("MyProject.zip", [
      createFileEntry({ path: "file1.wav" }),
    ]);
    registry.applyTransform(createDefaultRootPackageNameTransformer());
    registry.setSampleType("Loops");
    registry.applyTransform(createDefaultRootSampleTypeTransformer());
    registry.setPathStrategy(OrganisedPathStrategy);
    expect(registry.destinationPathFor("file1.wav")).toBe(
      "Loops/MyProject/file1.wav",
    );
  });
});
