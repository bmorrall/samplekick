import { describe, expect, it } from "vitest";
import { createSP404Mk2NameTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createSP404Mk2NameTransformer", () => {
  it("leaves already-valid names unchanged", () => {
    const entry = createTransformEntry({ name: "kick_01 (take).wav" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick_01 (take).wav");
  });

  it("preserves all allowed punctuation characters", () => {
    const entry = createTransformEntry({ name: "A _!&()+,=@[]{}.wav" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("A _!&()+,=@[]{}.wav");
  });

  it("preserves digits and upper/lowercase letters", () => {
    const entry = createTransformEntry({ name: "ABCabc123.wav" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("ABCabc123.wav");
  });

  it("normalizes accents and unsupported punctuation", () => {
    const entry = createTransformEntry({ name: "parênt [parent]" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("parent [parent]");
  });

  it("replaces curly apostrophes with straight single quotes", () => {
    const entry = createTransformEntry({ name: "it\u2019s a sample.wav" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("it's a sample.wav");
  });

  it("preserves only the final extension dot", () => {
    const entry = createTransformEntry({ name: "kick.01.alt.wav" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick_01_alt.wav");
  });

  it("leaves long names unsanitized (truncation is handled by createTruncateNameTransformer)", () => {
    const entry = createTransformEntry({ name: `${"+".repeat(90)}.wav` });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith(`${"+".repeat(90)}.wav`);
  });

  it("only calls setName and no other setters when packageName and sampleType are absent", () => {
    const entry = createTransformEntry({ name: "parênt [parent]" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "Drüms", packageName: "Påck", sampleType: "Drüms", keepStructure: true });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("sanitizes packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "SP404 Påck" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("SP404 Pack");
  });

  it("sanitizes sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Drüms" });
    createSP404Mk2NameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
  });
});
