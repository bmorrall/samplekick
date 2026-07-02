import { describe, expect, it } from "vitest";
import { createNormaliseHyphenSpacingTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createNormaliseHyphenSpacingTransformer", () => {
  it("adds space before a hyphen that is touching the word after it", () => {
    const entry = createTransformEntry({ name: "foo -bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("adds space after a hyphen that is touching the word before it", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("leaves a correctly spaced hyphen unchanged", () => {
    const entry = createTransformEntry({ name: "foo - bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("leaves a bare hyphen between two words unchanged", () => {
    const entry = createTransformEntry({ name: "foo-bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo-bar.wav");
  });

  it("adds underscore before a hyphen that is touching the word after it", () => {
    const entry = createTransformEntry({ name: "foo_-bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo_-_bar.wav");
  });

  it("adds underscore after a hyphen that is touching the word before it", () => {
    const entry = createTransformEntry({ name: "foo-_bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo_-_bar.wav");
  });

  it("leaves a correctly underscore-spaced hyphen unchanged", () => {
    const entry = createTransformEntry({ name: "foo_-_bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo_-_bar.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "Drums- Bass",
    });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Drums - Bass");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "Kicks -Snares",
    });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Kicks - Snares");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
    expect(entry.setReadOnly).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "foo- bar.wav",
      packageName: "Drums- Bass",
      sampleType: "Kicks -Snares",
      readOnly: true,
    });
    const transformer = createNormaliseHyphenSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
