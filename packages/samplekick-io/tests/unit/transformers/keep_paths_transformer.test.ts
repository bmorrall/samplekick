import { describe, expect, it } from "vitest";
import { createKeepPathsTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

const transformer = createKeepPathsTransformer();

describe("createKeepPathsTransformer", () => {
  it("sets keepStructure on file entries", () => {
    const entry = createTransformEntry({ name: "kick.wav", isFile: true });

    transformer.transform(singleEntryTransformSource(entry));

    expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
  });

  it("sets keepStructure on directory entries", () => {
    const entry = createTransformEntryInHierarchy(
      [{ name: "Pack.zip" }],
      { name: "Drums", isFile: false },
      [{ name: "kick.wav" }],
    );

    transformer.transform(singleEntryTransformSource(entry));

    expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
  });

  it("sets keepStructure on the root entry", () => {
    const entry = createTransformEntryInHierarchy(
      [],
      { name: "Pack.zip", isFile: false },
      [{ name: "kick.wav" }],
    );

    transformer.transform(singleEntryTransformSource(entry));

    expect(entry.setKeepStructure).toHaveBeenCalledWith(true);
  });
});
