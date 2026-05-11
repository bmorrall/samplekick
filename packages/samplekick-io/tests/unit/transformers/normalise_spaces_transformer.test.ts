import { describe, expect, it } from "vitest";
import { createNormaliseSpacesTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createNormaliseSpacesTransformer", () => {
  it("collapses double spaces to a single space", () => {
    const entry = createTransformEntry({ name: "foo  bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo bar.wav");
  });

  it("collapses more than two consecutive spaces", () => {
    const entry = createTransformEntry({ name: "foo   bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo bar.wav");
  });

  it("leaves a single space unchanged", () => {
    const entry = createTransformEntry({ name: "foo bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo bar.wav");
  });

  it("collapses double underscores to a single underscore", () => {
    const entry = createTransformEntry({ name: "foo__bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo_bar.wav");
  });

  it("collapses more than two consecutive underscores", () => {
    const entry = createTransformEntry({ name: "foo___bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo_bar.wav");
  });

  it("leaves a single underscore unchanged when the name has no spaces", () => {
    const entry = createTransformEntry({ name: "foo_bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo_bar.wav");
  });

  it("converts underscores to spaces when the name has spaces", () => {
    const entry = createTransformEntry({ name: "foo_bar baz.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("foo bar baz.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "My  Pack",
    });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("My Pack");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "Kicks  Snares",
    });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Kicks Snares");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "foo  bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "foo  bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "foo  bar.wav" });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "foo  bar.wav",
      packageName: "My  Pack",
      sampleType: "Kicks  Snares",
      keepStructure: true,
    });
    const transformer = createNormaliseSpacesTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
