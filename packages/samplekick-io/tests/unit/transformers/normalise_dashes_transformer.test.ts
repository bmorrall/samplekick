import { describe, expect, it } from "vitest";
import { createNormaliseDashesTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createNormaliseDashesTransformer", () => {
  it("replaces an en dash with a hyphen-minus", () => {
    const entry = createTransformEntry({ name: "foo \u2013 bar.wav" });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("replaces an em dash with a hyphen-minus", () => {
    const entry = createTransformEntry({ name: "foo \u2014 bar.wav" });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("replaces a horizontal bar with a hyphen-minus", () => {
    const entry = createTransformEntry({ name: "foo\u2015bar.wav" });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo-bar.wav");
  });

  it("replaces a figure dash with a hyphen-minus", () => {
    const entry = createTransformEntry({ name: "foo\u2012bar.wav" });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo-bar.wav");
  });

  it("replaces a small em dash with a hyphen-minus", () => {
    const entry = createTransformEntry({ name: "foo\ufe58bar.wav" });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo-bar.wav");
  });

  it("replaces a fullwidth hyphen-minus with a hyphen-minus", () => {
    const entry = createTransformEntry({ name: "foo\uff0dbar.wav" });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo-bar.wav");
  });

  it("leaves a plain hyphen-minus unchanged", () => {
    const entry = createTransformEntry({ name: "foo - bar.wav" });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "Drums \u2013 Bass",
    });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Drums - Bass");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "Drum\u2014Hits",
    });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Drum-Hits");
  });

  it("does not act on a keepStructure entry", () => {
    const entry = createTransformEntry({
      name: "foo \u2013 bar.mid",
      keepStructure: true,
    });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("does not act on a skipped entry", () => {
    const entry = createTransformEntry({
      name: "foo \u2013 bar.wav",
      skipped: true,
    });
    const transformer = createNormaliseDashesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });
});
