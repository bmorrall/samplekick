import { describe, expect, it } from "vitest";
import { NormaliseHyphenTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("NormaliseHyphenTransformer", () => {
  it("adds space before a hyphen that is touching the word after it", () => {
    const entry = createTransformEntry({ name: "foo -bar.wav" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("adds space after a hyphen that is touching the word before it", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("leaves a correctly spaced hyphen unchanged", () => {
    const entry = createTransformEntry({ name: "foo - bar.wav" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo - bar.wav");
  });

  it("leaves a hyphen with no adjacent space (e.g. compound word) unchanged", () => {
    const entry = createTransformEntry({ name: "foo-bar.wav" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo-bar.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "Drums- Bass" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Drums - Bass");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Kicks -Snares" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Kicks - Snares");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav" });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "foo- bar.wav", packageName: "Drums- Bass", sampleType: "Kicks -Snares", keepStructure: true });
    NormaliseHyphenTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
