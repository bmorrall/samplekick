import { describe, expect, it } from "vitest";
import { createInfoFileTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

const transformer = createInfoFileTransformer();

describe("createInfoFileTransformer", () => {
  it("disables a .txt file", () => {
    const entry = createTransformEntry({ name: "readme.txt" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("disables a .pdf file", () => {
    const entry = createTransformEntry({ name: "info.pdf" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("disables a .url file", () => {
    const entry = createTransformEntry({ name: "website.url" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("disables a .TXT file (case-insensitive)", () => {
    const entry = createTransformEntry({ name: "README.TXT" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("disables a .PDF file (case-insensitive)", () => {
    const entry = createTransformEntry({ name: "Info.PDF" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).toHaveBeenCalledWith(false);
  });

  it("does not disable a .wav file", () => {
    const entry = createTransformEntry({ name: "kick.wav" });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
  });

  it("does not disable a .txt file when read-only", () => {
    const entry = createTransformEntry({ name: "readme.txt", readOnly: true });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
  });

  it("does not act on a directory", () => {
    const entry = createTransformEntry({ name: "Docs", isFile: false });
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
  });
});
