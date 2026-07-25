import { describe, expect, it } from "vitest";
import { createStripLeadingBracketTransformer } from "../../../src";
import {
  createTransformEntry,
  singleEntryTransformSource,
} from "../../support";

describe("createStripLeadingBracketTransformer", () => {
  it("strips a bracket pair wrapping the whole base name", () => {
    const entry = createTransformEntry({ name: "(Counter).wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Counter.wav");
  });

  it("strips a multi-word bracket pair", () => {
    const entry = createTransformEntry({ name: "(Come Back).wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Come Back.wav");
  });

  it("strips only the first bracket pair, keeping a trailing suffix", () => {
    const entry = createTransformEntry({ name: "(Creep) - D#.wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Creep - D#.wav");
  });

  it("does not touch brackets that aren't at the start of the name", () => {
    const entry = createTransformEntry({ name: "REESE Fuzzy (C).wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("REESE Fuzzy (C).wav");
  });

  it("leaves a name with no leading bracket unchanged", () => {
    const entry = createTransformEntry({ name: "Kick.wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Kick.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      packageName: "(Vol 1) Pack",
    });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Vol 1 Pack");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({
      name: "kick.wav",
      sampleType: "(Deep) Drums",
    });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Deep Drums");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "(Counter).wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "(Counter).wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "(Counter).wav" });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setEnabled).not.toHaveBeenCalled();
    expect(entry.setReadOnly).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({
      name: "(Counter).wav",
      packageName: "(Vol 1) Pack",
      sampleType: "(Deep) Drums",
      readOnly: true,
    });
    const transformer = createStripLeadingBracketTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
