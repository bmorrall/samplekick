import { describe, expect, it } from "vitest";
import { createNormaliseCommaSpacingTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createNormaliseCommaSpacingTransformer", () => {
  it("removes space before a comma", () => {
    const entry = createTransformEntry({ name: "kick ,snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick, snare.wav");
  });

  it("removes extra space after a comma", () => {
    const entry = createTransformEntry({ name: "kick,  snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick, snare.wav");
  });

  it("normalises spaces around a comma", () => {
    const entry = createTransformEntry({ name: "kick , snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick, snare.wav");
  });

  it("leaves already-correct spacing unchanged", () => {
    const entry = createTransformEntry({ name: "kick, snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick, snare.wav");
  });

  it("leaves a bare comma between two words unchanged", () => {
    const entry = createTransformEntry({ name: "kick,snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick,snare.wav");
  });

  it("removes underscore before a comma in underscore mode", () => {
    const entry = createTransformEntry({ name: "kick_,snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick,_snare.wav");
  });

  it("removes extra underscore after a comma in underscore mode", () => {
    const entry = createTransformEntry({ name: "kick,__snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick,_snare.wav");
  });

  it("normalises underscores around a comma in underscore mode", () => {
    const entry = createTransformEntry({ name: "kick_,_snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick,_snare.wav");
  });

  it("leaves already-correct underscore spacing unchanged", () => {
    const entry = createTransformEntry({ name: "kick,_snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick,_snare.wav");
  });

  it("normalises packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "Drums , Bass" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Drums, Bass");
  });

  it("normalises sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Kicks ,Snares" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Kicks, Snares");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: "kick , snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: "kick , snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: "kick , snare.wav" });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "kick , snare.wav", packageName: "Drums , Bass", sampleType: "Kicks ,Snares", keepStructure: true });
    const transformer = createNormaliseCommaSpacingTransformer();
    transformer.transform(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
