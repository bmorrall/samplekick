import { describe, expect, it } from "vitest";
import { createDefaultRootSampleTypeTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

const transformer = createDefaultRootSampleTypeTransformer();

describe("createDefaultRootSampleTypeTransformer", () => {
  it("sets sampleType to Packs on the root node", () => {
    const entry = createTransformEntry({ name: "Example.zip" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Packs");
  });

  it("does not overwrite an existing sampleType", () => {
    const entry = createTransformEntry({
      name: "Example.zip",
      sampleType: "Loops",
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not act on non-root entries", () => {
    const entry = createTransformEntryInHierarchy([{ name: "Parent" }], {
      name: "Example.wav",
      isFile: true,
    });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not set packageName", () => {
    const entry = createTransformEntry({ name: "Example.zip" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });
});
