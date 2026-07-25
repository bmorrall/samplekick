import { describe, expect, it } from "vitest";
import { createSkipJunkTransformer } from "../../../src";
import {
  createTransformEntry,
  createTransformEntryInHierarchy,
  singleEntryTransformSource,
} from "../../support";

describe("createSkipJunkTransformer", () => {
  it("should skip entries named __MACOSX", () => {
    const entry = createTransformEntry({ name: "__MACOSX" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
    expect(entry.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("should skip hidden files starting with '.'", () => {
    const entry = createTransformEntry({ name: ".DS_Store" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
    expect(entry.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("should skip any entry whose name starts with '.'", () => {
    const entry = createTransformEntry({ name: ".hidden" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
    expect(entry.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("should not skip normal entries", () => {
    const entry = createTransformEntry({ name: "kick_01.wav" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
    expect(entry.setReadOnly).not.toHaveBeenCalled();
  });

  it("should not skip entries that merely contain __MACOSX in their name", () => {
    const entry = createTransformEntry({ name: "not__MACOSX" });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
    expect(entry.setReadOnly).not.toHaveBeenCalled();
  });

  it("marks a file beneath a __MACOSX ancestor as readOnly", () => {
    const entry = createTransformEntryInHierarchy([{ name: "__MACOSX" }], {
      name: "file1.wav",
      isFile: true,
    });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
    expect(entry.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("marks a file beneath a hidden ancestor directory as readOnly", () => {
    const entry = createTransformEntryInHierarchy([{ name: ".hidden-dir" }], {
      name: "file1.wav",
      isFile: true,
    });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
    expect(entry.setReadOnly).toHaveBeenCalledWith(true);
  });

  it("does not mark a normal nested file as readOnly", () => {
    const entry = createTransformEntryInHierarchy([{ name: "Drums" }], {
      name: "kick_01.wav",
      isFile: true,
    });
    const transformer = createSkipJunkTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
    expect(entry.setReadOnly).not.toHaveBeenCalled();
  });
});
