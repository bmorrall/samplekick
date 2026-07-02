import { describe, expect, it } from "vitest";
import { createSkipJunkTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createSkipJunkTransformer", () => {
  it("should skip entries named __MACOSX", () => {
    const entry = createTransformEntry({ name: "__MACOSX" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("should skip hidden files starting with '.'", () => {
    const entry = createTransformEntry({ name: ".DS_Store" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("should skip any entry whose name starts with '.'", () => {
    const entry = createTransformEntry({ name: ".hidden" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("should not skip normal entries", () => {
    const entry = createTransformEntry({ name: "kick_01.wav" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
  });

  it("should not skip entries that merely contain __MACOSX in their name", () => {
    const entry = createTransformEntry({ name: "not__MACOSX" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
  });
});
