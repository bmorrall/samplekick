import { describe, expect, it } from "vitest";
import { createNormaliseAccentsTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("createNormaliseAccentsTransformer", () => {
  it("strips accents from letters in the name", () => {
    const entry = createTransformEntry({ name: "parênt [parent].wav" });
    createNormaliseAccentsTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("parent [parent].wav");
  });

  it("strips accents from multiple characters", () => {
    const entry = createTransformEntry({ name: "Drüms & Påds.wav" });
    createNormaliseAccentsTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("Drums & Pads.wav");
  });

  it("leaves names without accents unchanged", () => {
    const entry = createTransformEntry({ name: "kick_01.wav" });
    createNormaliseAccentsTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick_01.wav");
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: "Drüms", keepStructure: true });
    createNormaliseAccentsTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
  });

  it("only calls setName and no other setters when packageName and sampleType are absent", () => {
    const entry = createTransformEntry({ name: "parênt" });
    createNormaliseAccentsTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("normalises accents in packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: "Påck" });
    createNormaliseAccentsTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("Pack");
  });

  it("normalises accents in sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: "Drüms" });
    createNormaliseAccentsTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
  });
});
