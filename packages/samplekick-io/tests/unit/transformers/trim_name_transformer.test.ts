import { describe, expect, it } from "vitest";
import { TrimNameTransformer } from "../../../src";
import { createTransformEntry, singleEntryTransformSource } from "../../support";

describe("TrimNameTransformer", () => {
  it("trims leading whitespace from the name", () => {
    const entry = createTransformEntry({ name: " kick.wav" });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick.wav");
  });

  it("trims trailing whitespace from the name", () => {
    const entry = createTransformEntry({ name: "kick.wav " });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick.wav");
  });

  it("trims both leading and trailing whitespace", () => {
    const entry = createTransformEntry({ name: "  kick.wav  " });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick.wav");
  });

  it("leaves a name with no surrounding whitespace unchanged", () => {
    const entry = createTransformEntry({ name: "kick.wav" });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).toHaveBeenCalledWith("kick.wav");
  });

  it("trims packageName when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", packageName: " My Pack " });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).toHaveBeenCalledWith("My Pack");
  });

  it("trims sampleType when the entry has one", () => {
    const entry = createTransformEntry({ name: "kick.wav", sampleType: " Drums " });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).toHaveBeenCalledWith("Drums");
  });

  it("does not call setPackageName when packageName is undefined", () => {
    const entry = createTransformEntry({ name: " kick.wav" });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setPackageName).not.toHaveBeenCalled();
  });

  it("does not call setSampleType when sampleType is undefined", () => {
    const entry = createTransformEntry({ name: " kick.wav" });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });

  it("does not call setSkipped or setKeepStructure", () => {
    const entry = createTransformEntry({ name: " kick.wav" });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setSkipped).not.toHaveBeenCalled();
    expect(entry.setKeepStructure).not.toHaveBeenCalled();
  });

  it("does not modify any fields when keepStructure is true", () => {
    const entry = createTransformEntry({ name: " kick.wav", packageName: " pack ", sampleType: " drums ", keepStructure: true });
    TrimNameTransformer(singleEntryTransformSource(entry));
    expect(entry.setName).not.toHaveBeenCalled();
    expect(entry.setPackageName).not.toHaveBeenCalled();
    expect(entry.setSampleType).not.toHaveBeenCalled();
  });
});
